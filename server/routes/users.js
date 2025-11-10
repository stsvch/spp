import { Router } from "express";
import { User } from "../models/User.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, requireRole("admin"), async (_req, res, next) => {
  try {
    const list = await User.find({}, { login: 1, role: 1 }).sort({ login: 1 }).lean();
    res.json(list.map(u => ({ id: String(u._id), login: u.login, role: u.role })));
  } catch (e) { next(e); }
});

router.patch("/:id/role", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json({ id: String(u._id), login: u.login, role: u.role });
  } catch (e) { next(e); }
});

router.post("/:id/logout-all", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: "User not found" });
    u.refreshTokens = [];
    await u.save();
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
