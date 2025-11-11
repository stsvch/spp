import mongoose from "mongoose";
import { Readable } from "stream";

let bucket;

function ensureBucket() {
  const connection = mongoose.connection;
  if (!connection || !connection.db) {
    throw new Error("MongoDB connection is not ready");
  }

  if (!bucket || bucket.s.db !== connection.db) {
    bucket = new mongoose.mongo.GridFSBucket(connection.db, {
      bucketName: "taskAttachments",
    });
  }

  return bucket;
}

function toObjectId(id) {
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(id);
}

export async function saveBufferToGridFS(buffer, filename, contentType) {
  const grid = ensureBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = grid.openUploadStream(filename, {
      contentType,
    });

    uploadStream.once("error", reject);
    uploadStream.once("finish", file => {
      if (file?._id) {
        resolve(file._id);
        return;
      }

      // The Node.js MongoDB driver can emit the finish event without a file
      // descriptor on newer versions. Fall back to the stream's `id` property
      // in that case to keep uploads working across driver releases.
      if (uploadStream.id) {
        resolve(uploadStream.id);
        return;
      }

      reject(new Error("File upload completed without an id"));
    });

    Readable.from(buffer).pipe(uploadStream);
  });
}

export function openDownloadStream(storageId) {
  const grid = ensureBucket();
  return grid.openDownloadStream(toObjectId(storageId));
}

export async function deleteFromGridFS(storageId) {
  const grid = ensureBucket();
  try {
    await grid.delete(toObjectId(storageId));
  } catch (err) {
    if (err?.code === "ENOENT" || err?.message?.includes("FileNotFound")) return;
    throw err;
  }
}
