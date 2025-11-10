import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_TTL = "15m",
  REFRESH_TOKEN_TTL = "7d",
} = process.env;

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export function signRefreshToken(user, jti) {
  return jwt.sign(
    { sub: user._id.toString(), jti },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

export function newRefreshRecord() {
  const jti = randomUUID();
  const ms = parseTtlMs(REFRESH_TOKEN_TTL);
  return { jti, expiresAt: new Date(Date.now() + ms) };
}

function parseTtlMs(ttl) {
  const m = String(ttl).match(/^(\d+)([smhd])$/i);
  if (!m) return 0;
  const n = Number(m[1]);
  return { s:1e3, m:6e4, h:36e5, d:864e5 }[m[2]] * n;
}
