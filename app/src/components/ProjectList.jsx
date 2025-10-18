import ProjectCard from "./ProjectCard.jsx";

export default function ProjectList({ projects, onOpenProject }) {
  if (!projects.length) return <p>Проектов пока нет.</p>;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} onOpen={onOpenProject} />
      ))}
    </div>
  );
}
