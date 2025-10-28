import { Router } from "express";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";

const router = Router();

// GET /api/projects
router.get("/", async (_req, res, next) => {
  try {
    const projects = await Project.find().lean();
    const ids = projects.map(p => p._id);
    const counts = await Task.aggregate([
      { $match: { project: { $in: ids } } },
      { $group: { _id: "$project", count: { $sum: 1 } } }
    ]);
    const map = new Map(counts.map(c => [String(c._id), c.count]));
    const withCount = projects.map(p => ({ ...p, tasksCount: map.get(String(p._id)) || 0, id: String(p._id) }));
    res.json(withCount);
  } catch (e) { next(e); }
});

// GET /api/projects/:id 
router.get("/:id", async (req, res, next) => {
  try {
    const proj = await Project.findById(req.params.id).lean();
    if (!proj) return res.status(404).json({ error: "Project not found" });
    const tasks = await Task.find({ project: proj._id }).lean();
    res.json({ ...proj, id: String(proj._id), tasks: tasks.map(t => ({ ...t, id: String(t._id) })) });
  } catch (e) { next(e); }
});

// POST /api/projects  { name, description?, members? }
router.post("/", async (req, res, next) => {
  try {
    const { name, description = "", members = [] } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: "Name is required" });
    const proj = await Project.create({ name: String(name).trim(), description, members });
    res.status(201).json({ ...proj.toObject(), id: String(proj._id) });
  } catch (e) { next(e); }
});

// PATCH /api/projects/:id  { name?, description?, members? }
router.patch("/:id", async (req, res, next) => {
  try {
    const patch = {};
    if (typeof req.body?.name === "string") patch.name = req.body.name.trim();
    if (typeof req.body?.description === "string") patch.description = req.body.description;
    if (Array.isArray(req.body?.members)) patch.members = req.body.members;

    const proj = await Project.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!proj) return res.status(404).json({ error: "Project not found" });
    res.json({ ...proj.toObject(), id: String(proj._id) });
  } catch (e) { next(e); }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const proj = await Project.findByIdAndDelete(req.params.id);
    if (!proj) return res.status(404).json({ error: "Project not found" });
    await Task.deleteMany({ project: proj._id });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
