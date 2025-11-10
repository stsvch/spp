import { Router } from "express";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { File } from "../models/File.js";
import { authRequired, memberOfProjectOrAdmin } from "../middleware/auth.js";
import { removeStoredFile, saveBufferToFile, resolveStoredFile } from "../utils/fileStorage.js";
import fs from "fs";
import path from "path";

const router = Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB

function serializeFile(file, projectId, taskId) {
  if (!file) return null;
  const id = String(file._id || file.id);
  return {
    id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    uploadedAt: file.createdAt,
    downloadUrl: `/api/projects/${projectId}/tasks/${taskId}/files/${id}`,
  };
}

function serializeTask(task) {
  const projectId = String(task.project);
  const taskId = String(task._id || task.id);
  const attachments = (task.attachments || [])
    .map(file => serializeFile(file, projectId, taskId))
    .filter(Boolean);

  return {
    ...task,
    id: taskId,
    project: projectId,
    attachments,
  };
}

// GET /api/projects/:id/tasks
router.get("/:id/tasks",    authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });
    const tasks = await Task.find({ project: project._id }).populate("attachments").lean();
    res.json(tasks.map(serializeTask));
  } catch (e) { next(e); }
});

// POST /api/projects/:id/tasks  { title, description?, assignee?, status? }
router.post("/:id/tasks",   authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const title = (req.body?.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required" });

    const task = await Task.create({
      title,
      description: (req.body?.description || "").trim(),
      assignee: (req.body?.assignee || "").trim(),
      status: req.body?.status || "todo",
      project: project._id,
    });

    res.status(201).json(serializeTask(task.toObject()));
  } catch (e) { next(e); }
});

// PATCH /api/projects/:id/tasks/:taskId
router.patch("/:id/tasks/:taskId", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const patch = {};
    ["title","description","assignee","status"].forEach(k => {
      if (typeof req.body?.[k] === "string") patch[k] = req.body[k].trim();
    });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, project: project._id },
      patch,
      { new: true }
    ).populate("attachments");
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(serializeTask(task.toObject()));
  } catch (e) { next(e); }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete("/:id/tasks/:taskId", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: project._id });
    if (!task) return res.status(404).json({ error: "Task not found" });
    const files = await File.find({ task: task._id }).lean();
    await File.deleteMany({ task: task._id });
    await Promise.all(files.map(f => removeStoredFile(f.storedName).catch(() => {})));
    res.status(204).end();
  } catch (e) { next(e); }
});

// POST /api/projects/:id/tasks/:taskId/files  { name, type, size, content }
router.post("/:id/tasks/:taskId/files", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const task = await Task.findOne({ _id: req.params.taskId, project: project._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const { name, type, size, content } = req.body || {};
    if (!name || typeof name !== "string") return res.status(400).json({ error: "File name is required" });
    if (!content || typeof content !== "string") return res.status(400).json({ error: "File content is required" });
    if (typeof size !== "number" || size < 0) return res.status(400).json({ error: "Invalid file size" });
    if (size > MAX_FILE_SIZE) return res.status(400).json({ error: "File is too large" });

    let buffer;
    try {
      buffer = Buffer.from(content, "base64");
    } catch {
      return res.status(400).json({ error: "Invalid file content" });
    }

    if (buffer.length > MAX_FILE_SIZE) return res.status(400).json({ error: "File is too large" });
    if (buffer.length !== size) return res.status(400).json({ error: "File size mismatch" });

    const { storedName } = await saveBufferToFile(buffer, name);

    const file = await File.create({
      originalName: name,
      mimeType: type || "application/octet-stream",
      size: buffer.length,
      storedName,
      project: project._id,
      task: task._id,
      uploadedBy: req.user?.id,
    });

    task.attachments.push(file._id);
    await task.save();

    const updatedTask = await Task.findById(task._id).populate("attachments").lean();

    res.status(201).json({
      file: serializeFile(file.toObject(), project._id, task._id),
      task: serializeTask(updatedTask),
    });
  } catch (e) { next(e); }
});

// GET /api/projects/:id/tasks/:taskId/files/:fileId
router.get("/:id/tasks/:taskId/files/:fileId", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const { id, taskId, fileId } = req.params;
    const file = await File.findOne({ _id: fileId, project: id, task: taskId });
    if (!file) return res.status(404).json({ error: "File not found" });

    const filePath = resolveStoredFile(file.storedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on server" });

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.sendFile(path.resolve(filePath));
  } catch (e) { next(e); }
});

// DELETE /api/projects/:id/tasks/:taskId/files/:fileId
router.delete("/:id/tasks/:taskId/files/:fileId", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const { id, taskId, fileId } = req.params;
    const file = await File.findOneAndDelete({ _id: fileId, project: id, task: taskId });
    if (!file) return res.status(404).json({ error: "File not found" });

    await Task.updateOne({ _id: taskId }, { $pull: { attachments: file._id } });
    await removeStoredFile(file.storedName);

    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
