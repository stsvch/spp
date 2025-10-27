import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import { ProjectsProvider } from "./context/ProjectsContext.jsx";

import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import Project from "./pages/Project.jsx";     
import ProjectCreate from "./pages/ProjectCreate.jsx"; 
import TaskCreate from "./pages/TaskCreate.jsx";
import UserProfile from "./pages/UserProfile.jsx";

export default function App() {
  return (
    <ProjectsProvider>
      <BrowserRouter>
        <Nav />
        <main style={{ padding: "16px" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<UserProfile />} />

            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<ProjectCreate />} />
            <Route path="/projects/:id" element={<Project />} />
            <Route path="/projects/:id/new-task" element={<TaskCreate />} />
            <Route path="/projects/:id/edit-task/:taskId" element={<TaskCreate />} />
          </Routes>
        </main>
      </BrowserRouter>
    </ProjectsProvider>
  );
}
