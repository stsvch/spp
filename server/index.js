// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./db.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import tasksRouter from "./routes/tasks.js";
import usersRouter from "./routes/users.js";
import { User } from "./models/User.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects", tasksRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

connectDB()
  .then(async () => {
    await ensureAdmin();
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("DB connection error:", err);
    process.exit(1);
  });

async function ensureAdmin() {
  const login = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;
  const reset = (process.env.RESET_ADMIN_PASSWORD || "false").toLowerCase() === "true";
  if (!login || !password) return;

  let user = await User.findOne({ login });

  if (!user) {
    user = new User({ login, password, role: "admin", refreshTokens: [] });
    await user.save();
    console.log(`Admin created: ${login}`);
    return;
  }

  let changed = false;
  if (user.role !== "admin") {
    user.role = "admin";
    changed = true;
    console.log(`User promoted to admin: ${login}`);
  }

  if (reset) {
    user.password = password;     // pre('save') захэширует
    changed = true;
    console.log(`Admin password reset for: ${login}`);
  }

  if (changed) await user.save();
  else console.log(`Admin already exists: ${login}`);
}
