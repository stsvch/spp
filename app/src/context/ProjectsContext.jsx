import { createContext, useContext, useEffect, useReducer } from "react";
import { api } from "../utils/api.js";

const ProjectsContext = createContext(null);

function normalizeProject(project) {
  if (!project) return project;

  const hasFullTasks = Array.isArray(project.tasks)
    && project.tasks.every(task => task && typeof task.status === "string");

  return {
    ...project,
    tasks: hasFullTasks ? project.tasks : undefined,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_PROJECTS":   return action.payload.map(normalizeProject);
    case "UPDATE_PROJECT": return state.map(p => p.id === action.payload.id ? normalizeProject(action.payload) : p);
    case "ADD_PROJECT":    return [...state, normalizeProject(action.payload)];
    case "REMOVE_PROJECT": return state.filter(p => p.id !== action.payload);
    default: return state;
  }
}

export function ProjectsProvider({ children }) {
  const [projects, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    api.getProjects()
      .then(list => dispatch({ type: "SET_PROJECTS", payload: list }))
      .catch(console.error);
  }, []);

  const actions = {
    async fetchProjects() {
      const list = await api.getProjects();                     // список без tasks, только tasksCount
      dispatch({ type: "SET_PROJECTS", payload: list });
      return list;
    },
    async reloadProject(id) {
      const proj = await api.getProject(id);                    // ПОЛНЫЙ проект С ЗАДАЧАМИ
      dispatch({ type: "UPDATE_PROJECT", payload: proj });
      return proj;
    },
    async createProject(nameOrPayload) {
      const payload = typeof nameOrPayload === "string"
        ? { name: nameOrPayload }
        : nameOrPayload;
      const created = await api.createProject(payload);
      dispatch({ type: "ADD_PROJECT", payload: created });
      return created;
    },
    async updateProject(id, patch) {
      const updated = await api.updateProject(id, patch);
      dispatch({ type: "UPDATE_PROJECT", payload: updated });
      return updated;
    },
    async deleteProject(id) {
      await api.deleteProject(id);
      dispatch({ type: "REMOVE_PROJECT", payload: id });
    },

    // задачи
    async addTask(projectId, task) {
      await api.createTask(projectId, task);
      return actions.reloadProject(projectId);
    },
    async updateTask(projectId, taskId, patch) {
      await api.updateTask(projectId, taskId, patch);
      return actions.reloadProject(projectId);
    },
    async deleteTask(projectId, taskId) {
      await api.deleteTask(projectId, taskId);
      return actions.reloadProject(projectId);
    },
    async uploadTaskFile(projectId, taskId, file) {
      await api.uploadTaskFile(projectId, taskId, file);
      return actions.reloadProject(projectId);
    },
    async deleteTaskFile(projectId, taskId, fileId) {
      await api.deleteTaskFile(projectId, taskId, fileId);
      return actions.reloadProject(projectId);
    },
  };

  return (
    <ProjectsContext.Provider value={{ projects, ...actions }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
