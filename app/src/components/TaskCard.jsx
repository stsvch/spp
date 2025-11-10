export default function TaskCard({ task, actions = null }) {
  if (!task) return null;

  return (
    <div className="card">
      <div style={{ fontWeight: 500 }}>
        {task.title}
      </div>

      {task.description && <small>{task.description}</small>}
      {task.assignee && <small>Исполнитель: {task.assignee}</small>}

      {actions}
    </div>
  );
}
