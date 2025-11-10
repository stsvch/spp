function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeFile(file, projectId, taskId) {
  if (!file) return null;
  const id = String(file._id || file.id);
  const project = String(projectId ?? file.project);
  const task = String(taskId ?? file.task);
  return {
    id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    uploadedAt: toIso(file.createdAt),
    downloadUrl: `/api/projects/${project}/tasks/${task}/files/${id}`,
  };
}

export function serializeTask(task) {
  if (!task) return null;
  const projectId = String(task.project?._id || task.project);
  const taskId = String(task._id || task.id);
  const attachments = (task.attachments || [])
    .map(file => serializeFile(file, projectId, taskId))
    .filter(Boolean);

  return {
    id: taskId,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    assignee: task.assignee ?? "",
    project: projectId,
    attachments,
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt),
  };
}

function baseProject(project) {
  return {
    id: String(project._id || project.id),
    name: project.name,
    description: project.description ?? "",
    members: (project.members || []).map(m => String(m)),
    createdAt: toIso(project.createdAt),
    updatedAt: toIso(project.updatedAt),
  };
}

export function serializeProjectSummary(project, tasksCount = 0, { includeEmptyTasks = false } = {}) {
  const base = baseProject(project);
  const result = { ...base, tasksCount };
  if (includeEmptyTasks) result.tasks = [];
  return result;
}

export function serializeProjectWithTasks(project, tasks = []) {
  const base = baseProject(project);
  const serializedTasks = tasks.map(serializeTask).filter(Boolean);
  return {
    ...base,
    tasks: serializedTasks,
    tasksCount: serializedTasks.length,
  };
}
