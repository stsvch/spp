const normalizeDate = value => (value instanceof Date ? value.toISOString() : value ?? null);

export function attachmentToClient(attachment) {
  if (!attachment) return null;
  const source = typeof attachment.toObject === "function"
    ? attachment.toObject()
    : attachment;

  return {
    id: source?._id ? String(source._id) : undefined,
    originalName: source?.originalName || "",
    mimeType: source?.mimeType || "application/octet-stream",
    size: source?.size ?? 0,
    uploadedAt: normalizeDate(source?.uploadedAt),
  };
}

export function taskToClient(task) {
  const source = typeof task?.toObject === "function"
    ? task.toObject({ depopulate: true })
    : task;

  if (!source) return null;

  const {
    _id,
    __v,
    attachments = [],
    project,
    createdAt,
    updatedAt,
    ...rest
  } = source;

  return {
    ...rest,
    id: _id ? String(_id) : undefined,
    project: project ? String(project) : rest.project,
    createdAt: normalizeDate(createdAt),
    updatedAt: normalizeDate(updatedAt),
    attachments: attachments.map(attachmentToClient),
  };
}
