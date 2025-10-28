import { Router } from "express";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";

const router = Router();

// GET /api/projects/:id/tasks
router.get("/:id/tasks", async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });
    const tasks = await Task.find({ project: project._id }).lean();
    res.json(tasks.map(t => ({ ...t, id: String(t._id) })));
  } catch (e) { next(e); }
});

// POST /api/projects/:id/tasks  { title, description?, assignee?, status? }
router.post("/:id/tasks", async (req, res, next) => {
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

    res.status(201).json({ ...task.toObject(), id: String(task._id) });
  } catch (e) { next(e); }
});

// PATCH /api/projects/:id/tasks/:taskId
router.patch("/:id/tasks/:taskId", async (req, res, next) => {
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
    res.json({ ...task.toObject(), id: String(task._id) });
  } catch (e) { next(e); }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete("/:id/tasks/:taskId", async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: project._id });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
