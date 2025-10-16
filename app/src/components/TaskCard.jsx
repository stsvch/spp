export default function TaskCard({ task }) {
  return (
    <div className="card">
      <div style={{ fontWeight: 600 }}>{task.title}</div>
      {task.description && <small>{task.description}</small>}
      {task.assignee && <small>Исполнитель: {task.assignee}</small>}
    </div>
  );
}
