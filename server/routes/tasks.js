import { Router } from "express";
import { createReadStream } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { authRequired, memberOfProjectOrAdmin } from "../middleware/auth.js";
import { ensureUploadsDir, getStoredFilePath, removeStoredFile } from "../utils/files.js";
import { attachmentToClient, taskToClient } from "../utils/serializers.js";
const router = Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeBase64(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();
  const commaIndex = trimmed.indexOf(",");
  const payload = commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
  return payload.replace(/\s+/g, "");
}

function safeOriginalName(name) {
  if (typeof name !== "string") return "";
  return name.split("/").pop().split("\\").pop();
}

async function deleteAttachmentsFiles(attachments = []) {
  await Promise.all(attachments.map(att => removeStoredFile(att?.filename)));
}

// GET /api/projects/:id/tasks
router.get("/:id/tasks",    authRequired, memberOfProjectOrAdmin,async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });
    const tasks = await Task.find({ project: project._id }).lean();
    res.json(tasks.map(taskToClient));
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

    res.status(201).json(taskToClient(task));
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
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(taskToClient(task));
  } catch (e) { next(e); }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete("/:id/tasks/:taskId",authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: project._id });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await deleteAttachmentsFiles(task.attachments || []);
    res.status(204).end();
  } catch (e) { next(e); }
});

// POST /api/projects/:id/tasks/:taskId/files  { name, contentType?, data(base64) }
router.post("/:id/tasks/:taskId/files", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const task = await Task.findOne({ _id: req.params.taskId, project: project._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const originalName = safeOriginalName(req.body?.name || "");
    const base64 = sanitizeBase64(req.body?.data || "");
    const contentType = typeof req.body?.contentType === "string" && req.body.contentType.trim()
      ? req.body.contentType.trim()
      : "application/octet-stream";

    if (!originalName) return res.status(400).json({ error: "File name is required" });
    if (!base64) return res.status(400).json({ error: "File data is required" });

    let buffer;
    try {
      buffer = Buffer.from(base64, "base64");
    } catch {
      return res.status(400).json({ error: "Invalid file data" });
    }

    if (!buffer || !buffer.length) {
      return res.status(400).json({ error: "File data is empty" });
    }
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({ error: "File is too large (max 10 MB)" });
    }

    await ensureUploadsDir();
    const ext = path.extname(originalName).slice(0, 20);
    const storedName = `${Date.now()}-${nanoid(12)}${ext}`;
    await fs.writeFile(getStoredFilePath(storedName), buffer);

    task.attachments.push({
      originalName,
      filename: storedName,
      mimeType: contentType,
      size: buffer.length,
    });
    await task.save();

    const created = task.attachments[task.attachments.length - 1];
    res.status(201).json(attachmentToClient(created));
  } catch (e) { next(e); }
});

// GET /api/projects/:id/tasks/:taskId/files/:fileId
router.get("/:id/tasks/:taskId/files/:fileId", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const task = await Task.findOne({ _id: req.params.taskId, project: project._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const attachment = task.attachments.id(req.params.fileId);
    if (!attachment) return res.status(404).json({ error: "File not found" });

    const filePath = getStoredFilePath(attachment.filename);
    try {
      await fs.access(filePath);
    } catch (err) {
      if (err?.code === "ENOENT") return res.status(404).json({ error: "File not found" });
      throw err;
    }

    const stream = createReadStream(filePath);
    stream.on("error", err => {
      if (err?.code === "ENOENT") {
        if (!res.headersSent) res.status(404).json({ error: "File not found" });
        return;
      }
      next(err);
    });

    const encodedName = encodeURIComponent(attachment.originalName || "file");
    res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedName}`);
    stream.pipe(res);
  } catch (e) { next(e); }
});

// DELETE /api/projects/:id/tasks/:taskId/files/:fileId
router.delete("/:id/tasks/:taskId/files/:fileId", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const task = await Task.findOne({ _id: req.params.taskId, project: project._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const attachment = task.attachments.id(req.params.fileId);
    if (!attachment) return res.status(404).json({ error: "File not found" });

    const filename = attachment.filename;
    attachment.deleteOne();
    await task.save();
    await removeStoredFile(filename);

    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
