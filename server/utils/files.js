import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

export async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export function getStoredFilePath(filename) {
  return path.join(UPLOADS_DIR, filename);
}

export async function removeStoredFile(filename) {
  if (!filename) return;
  try {
    await fs.unlink(getStoredFilePath(filename));
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
  }
}
