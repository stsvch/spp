import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { File } from "../models/File.js";
import { serializeProjectSummary, serializeProjectWithTasks, serializeTask, serializeFile } from "../utils/serializers.js";
import { deleteFromGridFS, saveBufferToGridFS } from "../utils/gridFsStorage.js";
import { clearRefreshCookie, setRefreshCookie } from "../utils/authCookies.js";
import { newRefreshRecord, signAccessToken, signRefreshToken } from "../utils/jwt.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
const { REFRESH_TOKEN_SECRET } = process.env;

class GqlError extends Error {
  constructor(message, code = "BAD_USER_INPUT") {
    super(message);
    this.name = "GraphQLError";
    this.extensions = { code };
  }
}

function createError(message, code = "BAD_USER_INPUT") {
  return new GqlError(message, code);
}

function requireAuth(ctx) {
  if (!ctx?.user) throw createError("Unauthorized", "UNAUTHENTICATED");
  return ctx.user;
}

function requireAdmin(ctx) {
  const user = requireAuth(ctx);
  if (user.role !== "admin") throw createError("Forbidden", "FORBIDDEN");
  return user;
}

async function requireProjectAccess(projectId, ctx) {
  if (!mongoose.isValidObjectId(projectId)) {
    throw createError("Invalid project id", "BAD_USER_INPUT");
  }
  const project = await Project.findById(projectId);
  if (!project) throw createError("Project not found", "NOT_FOUND");

  const user = requireAuth(ctx);
  if (user.role !== "admin") {
    const isMember = (project.members || []).some(m => m.toString() === user.id);
    if (!isMember) throw createError("Not a member of this project", "FORBIDDEN");
  }
  return project;
}

async function readRefresh(req) {
  try {
    const token = req?.cookies?.refresh;
    if (!token) throw new Error("No refresh cookie");
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new Error("User not found");
    const active = user.refreshTokens.find(r => r.tokenId === payload.jti && r.expiresAt > new Date());
    if (!active) throw new Error("Refresh not active");
    return { user, payload };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid refresh";
    throw createError(message === "No refresh cookie" ? message : "Invalid refresh", "UNAUTHENTICATED");
  }
}

function serializeUser(user) {
  return { id: String(user._id || user.id), login: user.login, role: user.role };
}

async function refreshTokens(user, res) {
  const rec = newRefreshRecord();
  user.refreshTokens.push({ tokenId: rec.jti, expiresAt: rec.expiresAt });
  await user.save();
  const refresh = signRefreshToken(user, rec.jti);
  setRefreshCookie(res, refresh);
  return signAccessToken(user);
}

export const resolvers = {
  Query: {
    health: () => true,
    me: async (_root, _args, ctx) => {
      if (!ctx?.user) return null;
      const user = await User.findById(ctx.user.id).lean();
      if (!user) return null;
      return serializeUser(user);
    },
    projects: async (_root, _args, ctx) => {
      requireAuth(ctx);
      const projects = await Project.find().lean();
      const ids = projects.map(p => p._id);
      const counts = await Task.aggregate([
        { $match: { project: { $in: ids } } },
        { $group: { _id: "$project", count: { $sum: 1 } } }
      ]);
      const map = new Map(counts.map(c => [String(c._id), c.count]));
      return projects.map(p =>
        serializeProjectSummary(p, map.get(String(p._id)) || 0, { includeEmptyTasks: true })
      );
    },
    project: async (_root, { id }, ctx) => {
      const project = await requireProjectAccess(id, ctx);
      const plainProject = project.toObject();
      const tasks = await Task.find({ project: project._id }).populate("attachments").lean();
      return serializeProjectWithTasks(plainProject, tasks);
    },
    users: async (_root, _args, ctx) => {
      requireAdmin(ctx);
      const list = await User.find({}, { login: 1, role: 1 }).sort({ login: 1 }).lean();
      return list.map(serializeUser);
    },
  },
  Mutation: {
    register: async (_root, { login, password }, ctx) => {
      const normalizedLogin = String(login || "").trim();
      if (!normalizedLogin || !password) throw createError("login & password required");
      const exists = await User.findOne({ login: normalizedLogin });
      if (exists) throw createError("login taken");
      const user = await User.create({ login: normalizedLogin, password, role: "member" });
      const accessToken = await refreshTokens(user, ctx.res);
      return { user: serializeUser(user), accessToken };
    },
    login: async (_root, { login, password }, ctx) => {
      const user = await User.findOne({ login });
      if (!user || !(await user.comparePassword(password))) {
        throw createError("Invalid credentials", "UNAUTHENTICATED");
      }
      user.refreshTokens = user.refreshTokens.filter(r => r.expiresAt > new Date());
      const accessToken = await refreshTokens(user, ctx.res);
      return { user: serializeUser(user), accessToken };
    },
    logout: async (_root, _args, ctx) => {
      const { user, payload } = await readRefresh(ctx.req);
      user.refreshTokens = user.refreshTokens.filter(r => r.tokenId !== payload.jti);
      await user.save();
      clearRefreshCookie(ctx.res);
      return true;
    },
    refresh: async (_root, _args, ctx) => {
      const { user, payload } = await readRefresh(ctx.req);
      user.refreshTokens = user.refreshTokens.filter(r => r.tokenId !== payload.jti);
      const accessToken = await refreshTokens(user, ctx.res);
      return { accessToken };
    },
    createProject: async (_root, { input }, ctx) => {
      requireAdmin(ctx);
      const name = String(input?.name || "").trim();
      if (!name) throw createError("Name is required");
      const project = await Project.create({
        name,
        description: input?.description ?? "",
        members: input?.members ?? [],
      });
      return serializeProjectWithTasks(project.toObject(), []);
    },
    updateProject: async (_root, { id, input }, ctx) => {
      requireAdmin(ctx);
      const patch = {};
      if (typeof input?.name === "string") patch.name = input.name.trim();
      if (typeof input?.description === "string") patch.description = input.description;
      if (Array.isArray(input?.members)) patch.members = input.members;
      const project = await Project.findByIdAndUpdate(id, patch, { new: true });
      if (!project) throw createError("Project not found", "NOT_FOUND");
      const tasks = await Task.find({ project: project._id }).populate("attachments").lean();
      return serializeProjectWithTasks(project.toObject(), tasks);
    },
    deleteProject: async (_root, { id }, ctx) => {
      requireAdmin(ctx);
      const project = await Project.findByIdAndDelete(id);
      if (!project) throw createError("Project not found", "NOT_FOUND");
      const files = await File.find({ project: project._id }).lean();
      await File.deleteMany({ project: project._id });
      await Task.deleteMany({ project: project._id });
      await Promise.all(files.map(f => deleteFromGridFS(f.storageId).catch(() => {})));
      return true;
    },
    addProjectMember: async (_root, { projectId, userId }, ctx) => {
      requireAdmin(ctx);
      if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(userId)) {
        throw createError("Invalid ids");
      }
      const [project, user] = await Promise.all([
        Project.findById(projectId),
        User.findById(userId),
      ]);
      if (!project) throw createError("Project not found", "NOT_FOUND");
      if (!user) throw createError("User not found", "NOT_FOUND");
      const exists = (project.members || []).some(m => m.toString() === userId);
      if (!exists) {
        project.members.push(user._id);
        await project.save();
      }
      return true;
    },
    removeProjectMember: async (_root, { projectId, userId }, ctx) => {
      requireAdmin(ctx);
      if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(userId)) {
        throw createError("Invalid ids");
      }
      const project = await Project.findById(projectId);
      if (!project) throw createError("Project not found", "NOT_FOUND");
      project.members = (project.members || []).filter(m => m.toString() !== userId);
      await project.save();
      return true;
    },
    createTask: async (_root, { projectId, input }, ctx) => {
      const project = await requireProjectAccess(projectId, ctx);
      const title = String(input?.title || "").trim();
      if (!title) throw createError("Title is required");
      const task = await Task.create({
        title,
        description: (input?.description || "").trim(),
        assignee: (input?.assignee || "").trim(),
        status: input?.status || "todo",
        project: project._id,
      });
      return serializeTask(task.toObject());
    },
    updateTask: async (_root, { projectId, taskId, input }, ctx) => {
      const project = await requireProjectAccess(projectId, ctx);
      const patch = {};
      ["title", "description", "assignee", "status"].forEach(key => {
        if (typeof input?.[key] === "string") {
          patch[key] = input[key].trim();
        }
      });
      const task = await Task.findOneAndUpdate(
        { _id: taskId, project: project._id },
        patch,
        { new: true }
      ).populate("attachments");
      if (!task) throw createError("Task not found", "NOT_FOUND");
      return serializeTask(task.toObject());
    },
    deleteTask: async (_root, { projectId, taskId }, ctx) => {
      const project = await requireProjectAccess(projectId, ctx);
      const task = await Task.findOneAndDelete({ _id: taskId, project: project._id });
      if (!task) throw createError("Task not found", "NOT_FOUND");
      const files = await File.find({ task: task._id }).lean();
      await File.deleteMany({ task: task._id });
      await Promise.all(files.map(f => deleteFromGridFS(f.storageId).catch(() => {})));
      return true;
    },
    uploadTaskFile: async (_root, { projectId, taskId, input }, ctx) => {
      const project = await requireProjectAccess(projectId, ctx);
      const task = await Task.findOne({ _id: taskId, project: project._id });
      if (!task) throw createError("Task not found", "NOT_FOUND");

      const name = input?.name;
      const type = input?.type || "application/octet-stream";
      const size = input?.size;
      const content = input?.content;
      if (!name || typeof name !== "string") throw createError("File name is required");
      if (!content || typeof content !== "string") throw createError("File content is required");
      if (typeof size !== "number" || size < 0) throw createError("Invalid file size");
      if (size > MAX_FILE_SIZE) throw createError("File is too large");

      let buffer;
      try {
        buffer = Buffer.from(content, "base64");
      } catch {
        throw createError("Invalid file content");
      }
      if (buffer.length > MAX_FILE_SIZE) throw createError("File is too large");
      if (buffer.length !== size) throw createError("File size mismatch");

      const storageId = await saveBufferToGridFS(buffer, name, type);
      const file = await File.create({
        originalName: name,
        mimeType: type,
        size: buffer.length,
        storageId,
        project: project._id,
        task: task._id,
        uploadedBy: ctx.user?.id,
      });

      task.attachments.push(file._id);
      await task.save();
      const updatedTask = await Task.findById(task._id).populate("attachments").lean();

      return {
        file: serializeFile(file.toObject(), project._id, task._id),
        task: serializeTask(updatedTask),
      };
    },
    deleteTaskFile: async (_root, { projectId, taskId, fileId }, ctx) => {
      await requireProjectAccess(projectId, ctx);
      const file = await File.findOneAndDelete({ _id: fileId, project: projectId, task: taskId });
      if (!file) throw createError("File not found", "NOT_FOUND");
      await Task.updateOne({ _id: taskId }, { $pull: { attachments: file._id } });
      await deleteFromGridFS(file.storageId);
      return true;
    },
    updateUserRole: async (_root, { userId, role }, ctx) => {
      requireAdmin(ctx);
      if (!mongoose.isValidObjectId(userId)) throw createError("Invalid user id");
      if (!["admin", "member"].includes(role)) throw createError("Invalid role");
      const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
      if (!user) throw createError("User not found", "NOT_FOUND");
      return serializeUser(user);
    },
    logoutUserEverywhere: async (_root, { userId }, ctx) => {
      requireAdmin(ctx);
      if (!mongoose.isValidObjectId(userId)) throw createError("Invalid user id");
      const user = await User.findById(userId);
      if (!user) throw createError("User not found", "NOT_FOUND");
      user.refreshTokens = [];
      await user.save();
      return true;
    },
  },
};
