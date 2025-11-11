// app/src/pages/Projects.jsx
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ProjectList from "../components/ProjectList.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Projects() {
  const { projects, fetchProjects } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects().catch(console.error);
  }, [fetchProjects]);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Проекты</h1>
        {user?.role === "admin" && (
          <Link to="/projects/new" className="btn">+ Создать проект</Link>
        )}
      </header>
      <ProjectList projects={projects} onOpenProject={(id) => navigate(`/projects/${id}`)} />
    </section>
  );
}
