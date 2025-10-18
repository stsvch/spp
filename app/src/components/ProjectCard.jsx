export default function ProjectCard({ project, onOpen }) {
  const tasksCount = project.tasks?.length ?? 0;
  return (
    <button
      onClick={() => onOpen(project.id)}
      style={{
        textAlign: "left",
        width: "100%",
        border: "1px solid #e8e8e8",
        borderRadius: 12,
        padding: "12px 14px",
        background: "#fff",
        cursor: "pointer",
      }}
    >
      <div style={{ fontWeight: 600 }}>{project.name}</div>
      <div style={{ color: "#666", marginTop: 6 }}>{tasksCount} задач(и)</div>
    </button>
  );
}
