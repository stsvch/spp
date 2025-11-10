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
    <section>
      <h1>Проекты</h1>
      <div style={{ marginBottom: 12 }}>
        {user?.role === "admin" && (
          <Link to="/projects/new"><button>+ Создать проект</button></Link>
        )}
      </div>
      <ProjectList projects={projects} onOpenProject={(id) => navigate(`/projects/${id}`)} />
    </section>
  );
}
