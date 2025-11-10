// app/src/utils/api.js
const BASE = import.meta.env.VITE_API_URL;

let accessToken = localStorage.getItem("access_token") || null;

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      const commaIndex = result.indexOf(",");
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
}

async function coreFetch(path, options = {}, tryRefresh = true) {
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  // если истёк access — пробуем обновить 1 раз
  if (res.status === 401 && tryRefresh) {
    const ok = await refreshAccess();
    if (ok) return coreFetch(path, options, false);
  }

  // обработка пустых тел (204 / пустой body)
  if (res.status === 204) return null;

  let data = null;
  const text = await res.text().catch(() => "");
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function refreshAccess() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export const api = {
  // ==== auth ====
  async register({ login, password }) {
    const data = await coreFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ login, password })
    }, false);
    setAccessToken(data.accessToken);
    return data.user;
  },
  async login({ login, password }) {
    const data = await coreFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password })
    }, false);
    setAccessToken(data.accessToken);
    return data.user;
  },
  async logout() {
    await coreFetch("/auth/logout", { method: "POST" }, false);
    setAccessToken(null);
  },
  me: () => coreFetch("/auth/me"),           // <—— ДОБАВЛЕНО

  // ==== projects ====
  getProjects: () => coreFetch("/projects"),
  getProject:  (id) => coreFetch(`/projects/${id}`),
  createProject: (payload) => coreFetch("/projects", { method: "POST", body: JSON.stringify(payload) }),
  updateProject: (id, patch) => coreFetch(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProject: (id) => coreFetch(`/projects/${id}`, { method: "DELETE" }),

  // ==== tasks ====
  listTasks: (projectId) => coreFetch(`/projects/${projectId}/tasks`),
  createTask:(projectId, task) => coreFetch(`/projects/${projectId}/tasks`, { method:"POST", body: JSON.stringify(task) }),
  updateTask:(projectId, taskId, patch) => coreFetch(`/projects/${projectId}/tasks/${taskId}`, { method:"PATCH", body: JSON.stringify(patch) }),
  deleteTask:(projectId, taskId) => coreFetch(`/projects/${projectId}/tasks/${taskId}`, { method:"DELETE" }),
  uploadTaskFile: async (projectId, taskId, file) => {
    const base64 = await readFileAsBase64(file);
    const payload = {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      content: base64,
    };
    return coreFetch(`/projects/${projectId}/tasks/${taskId}/files`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteTaskFile:(projectId, taskId, fileId) =>
    coreFetch(`/projects/${projectId}/tasks/${taskId}/files/${fileId}`, { method:"DELETE" }),

  // ==== users & members (для админа / менеджера участников) ====
  listUsers: () => coreFetch("/users"), // только admin
  addMember: (projectId, userId) =>
    coreFetch(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify({ userId }) }),
  removeMember: (projectId, userId) =>
    coreFetch(`/projects/${projectId}/members/${userId}`, { method: "DELETE" }),
};
