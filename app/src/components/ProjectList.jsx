import ProjectCard from "./ProjectCard.jsx";

export default function ProjectList({ projects, onOpenProject }) {
  if (!projects.length) return <p>Проектов пока нет.</p>;
  return (
    <div className="project-grid">
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} onOpen={onOpenProject} />
      ))}
    </div>
  );
}
