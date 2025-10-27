import { useNavigate, Link } from "react-router-dom";
import ProjectList from "../components/ProjectList.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";

export default function Projects() {
  const { projects } = useProjects();
  const navigate = useNavigate();

  return (
    <section>
      <h1>Проекты</h1>
      <div style={{ marginBottom: 12 }}>
        <Link to="/projects/new"><button>+ Создать проект</button></Link>
      </div>
      <ProjectList projects={projects} onOpenProject={(id) => navigate(`/projects/${id}`)} />
    </section>
  );
}
