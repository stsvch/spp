// app/src/utils/api.js
const BASE = import.meta.env.VITE_API_URL;
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

let accessToken = localStorage.getItem("access_token") || null;

export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
}

async function authorizedFetch(path, options = {}, tryRefresh = true) {
  const headers = { ...(options.headers || {}) };

  if (options.body !== undefined && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (!headers.Accept) headers.Accept = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 401 && tryRefresh) {
    const ok = await refreshAccess();
    if (ok) return authorizedFetch(path, options, false);
  }

  return response;
}

async function coreFetch(path, options = {}, tryRefresh = true) {
  const res = await authorizedFetch(path, options, tryRefresh);

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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => {
      const result = reader.result || "";
      const str = typeof result === "string" ? result : "";
      const commaIndex = str.indexOf(",");
      resolve(commaIndex >= 0 ? str.slice(commaIndex + 1) : str);
    };
    reader.readAsDataURL(file);
  });
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
  async uploadTaskFile(projectId, taskId, file) {
    if (!file) throw new Error("Файл не выбран");
    if (file.size > MAX_UPLOAD_SIZE) throw new Error("Файл превышает 10 МБ");
    const data = await fileToBase64(file);
    return coreFetch(`/projects/${projectId}/tasks/${taskId}/files`, {
      method: "POST",
      body: JSON.stringify({
        name: file.name,
        contentType: file.type || "application/octet-stream",
        data,
      }),
    });
  },
  deleteTaskFile: (projectId, taskId, fileId) =>
    coreFetch(`/projects/${projectId}/tasks/${taskId}/files/${fileId}`, { method: "DELETE" }),
  async downloadTaskFile(projectId, taskId, fileId) {
    const res = await authorizedFetch(`/projects/${projectId}/tasks/${taskId}/files/${fileId}`, {
      method: "GET",
      headers: { Accept: "*/*" },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = `HTTP ${res.status}`;
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) msg = parsed.error;
        } catch {}
      }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    let filename = `file-${fileId}`;
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    if (match) {
      filename = decodeURIComponent(match[1] || match[2]);
    }

    return { blob, filename };
  },

  // ==== users & members (для админа / менеджера участников) ====
  listUsers: () => coreFetch("/users"), // только admin
  addMember: (projectId, userId) =>
    coreFetch(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify({ userId }) }),
  removeMember: (projectId, userId) =>
    coreFetch(`/projects/${projectId}/members/${userId}`, { method: "DELETE" }),
};
