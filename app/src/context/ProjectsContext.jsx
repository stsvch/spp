import { createContext, useContext, useEffect, useReducer } from "react";
import { api } from "../utils/api.js";

const ProjectsContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case "SET_PROJECTS":   return action.payload;
    case "UPDATE_PROJECT": return state.map(p => p.id === action.payload.id ? action.payload : p);
    case "ADD_PROJECT":    return [...state, action.payload];
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
    async createProject(name) {
      const created = await api.createProject(name);
      dispatch({ type: "ADD_PROJECT", payload: created });
      return created;
    },
    async reloadProject(id) {
      const proj = await api.getProject(id);
      dispatch({ type: "UPDATE_PROJECT", payload: proj });
      return proj;
    },
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
