export default function ProjectCard({ project, onOpen }) {
  const tasksCount = project.tasksCount ?? 0;

  return (
    <button
      type="button"
      className="project-card"
      onClick={() => onOpen(project.id)}
    >
      <div className="project-card__title">{project.name}</div>
      <div className="project-card__meta">{tasksCount} задач(и)</div>
    </button>
  );
}
