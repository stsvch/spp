import { Router } from "express";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { authRequired, requireRole, memberOfProjectOrAdmin } from "../middleware/auth.js";
const router = Router();

// GET /api/projects
router.get("/", authRequired, async (_req, res, next) => { 
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
router.get("/:id", authRequired, memberOfProjectOrAdmin, async (req, res, next) => {
  try {
    const proj = await Project.findById(req.params.id).lean();
    if (!proj) return res.status(404).json({ error: "Project not found" });
    const tasks = await Task.find({ project: proj._id }).lean();
    res.json({ ...proj, id: String(proj._id), tasks: tasks.map(t => ({ ...t, id: String(t._id) })) });
  } catch (e) { next(e); }
});

// POST /api/projects  { name, description?, members? }
router.post("/", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, description = "", members = [] } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: "Name is required" });
    const proj = await Project.create({ name: String(name).trim(), description, members });
    res.status(201).json({ ...proj.toObject(), id: String(proj._id) });
  } catch (e) { next(e); }
});

// PATCH /api/projects/:id  { name?, description?, members? }
router.patch("/:id", authRequired, requireRole("admin"), async (req, res, next) => {
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
router.delete("/:id", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const proj = await Project.findByIdAndDelete(req.params.id);
    if (!proj) return res.status(404).json({ error: "Project not found" });
    await Task.deleteMany({ project: proj._id });
    res.status(204).end();
  } catch (e) { next(e); }
});

// ADMIN: добавить участника по userId
router.post("/:id/members", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const { id } = req.params;                      // project id
    const { userId } = req.body || {};
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }
    const [proj, user] = await Promise.all([
      Project.findById(id),
      User.findById(userId, { _id: 1 })
    ]);
    if (!proj) return res.status(404).json({ error: "Project not found" });
    if (!user) return res.status(404).json({ error: "User not found" });

    const exists = (proj.members ?? []).some(m => m.toString() === userId);
    if (!exists) proj.members.push(user._id);
    await proj.save();

    res.status(204).end();
  } catch (e) { next(e); }
});

// ADMIN: удалить участника
router.delete("/:id/members/:userId", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }
    const proj = await Project.findById(id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    proj.members = (proj.members ?? []).filter(m => m.toString() !== userId);
    await proj.save();

    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
