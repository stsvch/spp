import { createContext, useContext, useEffect, useReducer } from "react";
import { generateId } from "../utils/id.js";

const ProjectsContext = createContext(null);

const initialState = (() => {
  try {
    const raw = localStorage.getItem("projects-state");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: generateId(),
      name: "Веб-сайт кафедры",
      tasks: [
        { id: generateId(), title: "Скелет страниц", description: "header, footer", assignee: "Янина", status: "todo" },
        { id: generateId(), title: "Стилизация", description: "цвета, шрифты", assignee: "Иван", status: "in-progress" },
        { id: generateId(), title: "Dockerfile", description: "nginx", assignee: "Олег", status: "done" },
      ],
    },
  ];
})();

function reducer(state, action) {
  switch (action.type) {
    case "PROJECT_ADD": {
      const { name } = action.payload;
      return [...state, { id: generateId(), name, tasks: [] }];
    }
    case "TASK_ADD": {
      const { projectId, task } = action.payload;
      return state.map(p =>
        p.id === projectId
          ? { ...p, tasks: [...p.tasks, { id: generateId(), ...task }] }
          : p
      );
    }
    case "TASK_UPDATE": {
      const { projectId, taskId, patch } = action.payload;
      return state.map(p =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t)),
            }
          : p
      );
    }
    case "TASK_DELETE": {
      const { projectId, taskId } = action.payload;
      return state.map(p =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
      );
    }
    default:
      return state;
  }
}

export function ProjectsProvider({ children }) {
  const [projects, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      localStorage.setItem("projects-state", JSON.stringify(projects));
    } catch {}
  }, [projects]);

  return (
    <ProjectsContext.Provider value={{ projects, dispatch }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
