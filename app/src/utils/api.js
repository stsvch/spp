const BASE = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  getProjects: () => request("/projects"),
  getProject:   (id) => request(`/projects/${id}`),
  createProject:(name) => request("/projects", { method:"POST", body: JSON.stringify({ name }) }),
  updateProject:(id, patch) => request(`/projects/${id}`, { method:"PATCH", body: JSON.stringify(patch) }),
  deleteProject:(id) => request(`/projects/${id}`, { method:"DELETE" }),

  listTasks:   (projectId) => request(`/projects/${projectId}/tasks`),
  createTask:  (projectId, task) => request(`/projects/${projectId}/tasks`, { method:"POST", body: JSON.stringify(task) }),
  updateTask:  (projectId, taskId, patch) => request(`/projects/${projectId}/tasks/${taskId}`, { method:"PATCH", body: JSON.stringify(patch) }),
  deleteTask:  (projectId, taskId) => request(`/projects/${projectId}/tasks/${taskId}`, { method:"DELETE" }),
};
