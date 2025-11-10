// app/src/utils/api.js
const BASE = import.meta.env.VITE_API_URL;
const GRAPHQL_URL = `${BASE}/graphql`;

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

async function graphqlRequest(query, { variables = {}, field, tryRefresh = true } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(GRAPHQL_URL, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new Error("Не удалось связаться с сервером");
  }

  const text = await response.text().catch(() => "");
  let json = {};
  if (text) {
    try { json = JSON.parse(text); }
    catch { throw new Error("Некорректный ответ сервера"); }
  }

  if (!response.ok && !(json.errors?.length)) {
    throw new Error(`HTTP ${response.status}`);
  }

  const errors = json.errors || [];
  if (errors.length) {
    const unauthorized = errors.some(err => err.extensions?.code === "UNAUTHENTICATED");
    if (unauthorized && tryRefresh) {
      const refreshed = await refreshAccess();
      if (refreshed) {
        return graphqlRequest(query, { variables, field, tryRefresh: false });
      }
    }
    throw new Error(errors[0]?.message || "GraphQL error");
  }

  const data = json.data || {};
  return field ? data[field] : data;
}

async function refreshAccess() {
  try {
    const payload = await graphqlRequest(
      `mutation Refresh { refresh { accessToken } }`,
      { field: "refresh", tryRefresh: false }
    );
    if (payload?.accessToken) {
      setAccessToken(payload.accessToken);
      return true;
    }
    setAccessToken(null);
    return false;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export const api = {
  async register({ login, password }) {
    const data = await graphqlRequest(
      `mutation Register($login: String!, $password: String!) {
        register(login: $login, password: $password) {
          accessToken
          user { id login role }
        }
      }`,
      { variables: { login, password }, field: "register", tryRefresh: false }
    );
    setAccessToken(data.accessToken);
    return data.user;
  },
  async login({ login, password }) {
    const data = await graphqlRequest(
      `mutation Login($login: String!, $password: String!) {
        login(login: $login, password: $password) {
          accessToken
          user { id login role }
        }
      }`,
      { variables: { login, password }, field: "login", tryRefresh: false }
    );
    setAccessToken(data.accessToken);
    return data.user;
  },
  async logout() {
    await graphqlRequest(
      `mutation Logout { logout }`,
      { field: "logout", tryRefresh: false }
    );
    setAccessToken(null);
  },
  me: () => graphqlRequest(
    `query Me { me { id login role } }`,
    { field: "me" }
  ),

  getProjects: () => graphqlRequest(
    `query Projects {
      projects {
        id
        name
        description
        members
        tasksCount
        createdAt
        updatedAt
        tasks { id }
      }
    }`,
    { field: "projects" }
  ),
  getProject: (id) => graphqlRequest(
    `query Project($id: ID!) {
      project(id: $id) {
        id
        name
        description
        members
        tasksCount
        createdAt
        updatedAt
        tasks {
          id
          title
          description
          status
          assignee
          project
          createdAt
          updatedAt
          attachments {
            id
            originalName
            mimeType
            size
            uploadedAt
            downloadUrl
          }
        }
      }
    }`,
    { variables: { id }, field: "project" }
  ),
  createProject: (input) => graphqlRequest(
    `mutation CreateProject($input: ProjectInput!) {
      createProject(input: $input) {
        id
        name
        description
        members
        tasksCount
        createdAt
        updatedAt
        tasks {
          id
          title
          status
          assignee
          attachments { id downloadUrl originalName mimeType size uploadedAt }
        }
      }
    }`,
    { variables: { input }, field: "createProject" }
  ),
  updateProject: (id, input) => graphqlRequest(
    `mutation UpdateProject($id: ID!, $input: ProjectPatch!) {
      updateProject(id: $id, input: $input) {
        id
        name
        description
        members
        tasksCount
        createdAt
        updatedAt
        tasks {
          id
          title
          description
          status
          assignee
          project
          createdAt
          updatedAt
          attachments {
            id
            originalName
            mimeType
            size
            uploadedAt
            downloadUrl
          }
        }
      }
    }`,
    { variables: { id, input }, field: "updateProject" }
  ),
  deleteProject: (id) => graphqlRequest(
    `mutation DeleteProject($id: ID!) { deleteProject(id: $id) }`,
    { variables: { id }, field: "deleteProject" }
  ),

  createTask: (projectId, input) => graphqlRequest(
    `mutation CreateTask($projectId: ID!, $input: TaskInput!) {
      createTask(projectId: $projectId, input: $input) {
        id
        title
        status
      }
    }`,
    { variables: { projectId, input }, field: "createTask" }
  ),
  updateTask: (projectId, taskId, input) => graphqlRequest(
    `mutation UpdateTask($projectId: ID!, $taskId: ID!, $input: TaskPatch!) {
      updateTask(projectId: $projectId, taskId: $taskId, input: $input) {
        id
        title
        status
      }
    }`,
    { variables: { projectId, taskId, input }, field: "updateTask" }
  ),
  deleteTask: (projectId, taskId) => graphqlRequest(
    `mutation DeleteTask($projectId: ID!, $taskId: ID!) {
      deleteTask(projectId: $projectId, taskId: $taskId)
    }`,
    { variables: { projectId, taskId }, field: "deleteTask" }
  ),
  uploadTaskFile: async (projectId, taskId, file) => {
    const base64 = await readFileAsBase64(file);
    const payload = {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      content: base64,
    };
    return graphqlRequest(
      `mutation UploadFile($projectId: ID!, $taskId: ID!, $input: UploadFileInput!) {
        uploadTaskFile(projectId: $projectId, taskId: $taskId, input: $input) {
          file {
            id
            originalName
            mimeType
            size
            uploadedAt
            downloadUrl
          }
          task {
            id
            title
            description
            status
            assignee
            project
            attachments {
              id
              originalName
              mimeType
              size
              uploadedAt
              downloadUrl
            }
          }
        }
      }`,
      { variables: { projectId, taskId, input: payload }, field: "uploadTaskFile" }
    );
  },
  deleteTaskFile: (projectId, taskId, fileId) => graphqlRequest(
    `mutation DeleteTaskFile($projectId: ID!, $taskId: ID!, $fileId: ID!) {
      deleteTaskFile(projectId: $projectId, taskId: $taskId, fileId: $fileId)
    }`,
    { variables: { projectId, taskId, fileId }, field: "deleteTaskFile" }
  ),

  listUsers: () => graphqlRequest(
    `query Users { users { id login role } }`,
    { field: "users" }
  ),
  addMember: (projectId, userId) => graphqlRequest(
    `mutation AddMember($projectId: ID!, $userId: ID!) {
      addProjectMember(projectId: $projectId, userId: $userId)
    }`,
    { variables: { projectId, userId }, field: "addProjectMember" }
  ),
  removeMember: (projectId, userId) => graphqlRequest(
    `mutation RemoveMember($projectId: ID!, $userId: ID!) {
      removeProjectMember(projectId: $projectId, userId: $userId)
    }`,
    { variables: { projectId, userId }, field: "removeProjectMember" }
  ),
};

export { refreshAccess };
