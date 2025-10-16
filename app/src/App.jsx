import { useState } from "react";
import Nav from "./components/Nav.jsx";
import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import Project from "./pages/ProjectPage.jsx";     
import TaskCreate from "./pages/TaskCreate.jsx"; 
import { generateId } from "./utils/id.js";
import UserProfile from "./pages/UserProfile.jsx";


export default function App() {
  const [page, setPage] = useState("home");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [projects, setProjects] = useState([
    {
      id: generateId(),
      name: "Веб-сайт кафедры",
      tasks: [
        { id: generateId(), title: "Скелет страниц", description: "header, footer", assignee: "Янина", status: "todo" },
        { id: generateId(), title: "Стилизация", description: "цвета, шрифты", assignee: "Иван", status: "in-progress" },
        { id: generateId(), title: "Dockerfile", description: "nginx", assignee: "Олег", status: "done" },
      ],
    },
    {
      id: generateId(),
      name: "Мобильное приложение",
      tasks: [
        { id: generateId(), title: "Экран входа", description: "валидация", assignee: "Мария", status: "todo" },
      ],
    },
  ]);

  const openProjects = () => setPage("projects");
  const openProject = (id) => { setSelectedProjectId(id); setPage("project"); };
  const openTaskCreate = () => setPage("taskCreate");
  const goHome = () => setPage("home");

  function addTaskToProject(projectId, taskInput) {
    setProjects(prev =>
      prev.map(p => p.id === projectId
        ? { ...p, tasks: [...p.tasks, { id: generateId(), ...taskInput }] }
        : p
      )
    );
  }

  const currentProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <Nav
        current={page}
        onNavigate={(id) => {
          if (id === "projects") openProjects();
          else if (id === "home") goHome();
          else setPage(id);
        }}
      />

      <main style={{ padding: "16px" }}>
        {page === "home"     && <Home />}
        {page === "projects" && <Projects projects={projects} onOpenProject={openProject} />}
        {page === "project"  && currentProject && (
          <Project
            project={currentProject}
            onBack={openProjects}
            onOpenCreateTask={openTaskCreate}
          />
        )}
        {page === "taskCreate" && currentProject && (
          <TaskCreate
            project={currentProject}
            onCancel={() => setPage("project")}
            onCreate={(taskInput) => {
              addTaskToProject(currentProject.id, taskInput);
              setPage("project");
            }}
          />
        )}
        {page === "profile" && <UserProfile />} 
      </main>
    </div>
  );
}
