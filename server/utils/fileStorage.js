import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveBufferToFile(buffer, originalName) {
  await ensureUploadDir();
  const ext = path.extname(originalName || "");
  const storedName = `${Date.now()}-${nanoid(8)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);
  await fs.writeFile(filePath, buffer);
  return { storedName, filePath };
}

export function resolveStoredFile(storedName) {
  return path.join(UPLOAD_DIR, storedName);
}

export async function removeStoredFile(storedName) {
  try {
    await fs.unlink(resolveStoredFile(storedName));
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
  }
}

export { UPLOAD_DIR };
