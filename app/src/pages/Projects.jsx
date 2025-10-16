import ProjectList from "../components/ProjectList.jsx";

export default function Projects({ projects, onOpenProject }) {
  return (
    <section>
      <h1>Проекты</h1>
      <ProjectList projects={projects} onOpenProject={onOpenProject} />
    </section>
  );
}
