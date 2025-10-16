export default function TaskCard({
  task,
  showCreatedAt = false,
  highlightTitle = false 
}) {
  if (!task) return null;

  return (
    <div className="card">
      <div style={{ fontWeight: highlightTitle ? 600 : 500 }}>
        {task.title}
      </div>

      {task.description && <small>{task.description}</small>}

      {task.assignee && <small>Исполнитель: {task.assignee}</small>}

      {showCreatedAt && task.createdAt && (
        <small>создана {new Date(task.createdAt).toLocaleDateString("ru-RU")}</small>
      )}
    </div>
  );
}
