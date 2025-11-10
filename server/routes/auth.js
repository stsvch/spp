import { Router } from "express";
import { User } from "../models/User.js";
import { newRefreshRecord, signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { verifyRefresh } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { login, password, role = "member" } = req.body || {};
  if (!login || !password) return res.status(400).json({ error: "login & password required" });
  const exists = await User.findOne({ login });
  if (exists) return res.status(400).json({ error: "login taken" });

  const user = await User.create({ login, password, role });
  const access = signAccessToken(user);
  const rec = newRefreshRecord();
  user.refreshTokens.push({ tokenId: rec.jti, expiresAt: rec.expiresAt });
  await user.save();
  const refresh = signRefreshToken(user, rec.jti);

  setRefreshCookie(res, refresh);
  res.status(201).json({ user: { id: user._id, login: user.login, role: user.role }, accessToken: access });
});

router.post("/login", async (req, res) => {
  const { login, password } = req.body || {};
  const user = await User.findOne({ login });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const access = signAccessToken(user);
  const rec = newRefreshRecord();
  user.refreshTokens.push({ tokenId: rec.jti, expiresAt: rec.expiresAt });
  await user.save();
  const refresh = signRefreshToken(user, rec.jti);

  setRefreshCookie(res, refresh);
  res.json({ user: { id: user._id, login: user.login, role: user.role }, accessToken: access });
});

router.post("/refresh", verifyRefresh, async (req, res) => {
  const { user, payload } = req.refresh;
  user.refreshTokens = user.refreshTokens.filter(r => r.tokenId !== payload.jti);
  const rec = newRefreshRecord();
  user.refreshTokens.push({ tokenId: rec.jti, expiresAt: rec.expiresAt });
  await user.save();

  const access = signAccessToken(user);
  const refresh = signRefreshToken(user, rec.jti);
  setRefreshCookie(res, refresh);
  res.json({ accessToken: access });
});

router.post("/logout", verifyRefresh, async (req, res) => {
  const { user, payload } = req.refresh;
  user.refreshTokens = user.refreshTokens.filter(r => r.tokenId !== payload.jti);
  await user.save();
  clearRefreshCookie(res);
  res.status(204).end();
});

function setRefreshCookie(res, token) {
  res.cookie("refresh", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}
function clearRefreshCookie(res) {
  res.clearCookie("refresh", { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
}

export default router;
