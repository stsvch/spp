import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;

export async function authRequired(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const [, token] = hdr.split(" ");
    if (!token) return res.status(401).json({ error: "No token" });

    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

import { Project } from "../models/Project.js";
export async function memberOfProjectOrAdmin(req, res, next) {
  if (req.user.role === "admin") return next();
  const projectId = req.params.id || req.params.projectId || req.body.project;
  if (!projectId) return res.status(400).json({ error: "Project id required" });
  const project = await Project.findById(projectId).lean();
  if (!project) return res.status(404).json({ error: "Project not found" });
  const isMember = (project.members || []).some(m => String(m) === req.user.id);
  if (!isMember) return res.status(403).json({ error: "Not a member of this project" });
  next();
}

export async function verifyRefresh(req, res, next) {
  try {
    const token = req.cookies?.refresh;
    if (!token) return res.status(401).json({ error: "No refresh cookie" });
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET); // {sub, jti}
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    const active = user.refreshTokens.find(r => r.tokenId === payload.jti && r.expiresAt > new Date());
    if (!active) return res.status(401).json({ error: "Refresh not active" });
    req.refresh = { payload, user };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid refresh" });
  }
}
