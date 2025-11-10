export default function TaskCard({
  task,
  onClick = null,               // NEW
  showCreatedAt = false,
  highlightTitle = false,
  actions = null,
}) {
  if (!task) return null;

  return (
    <div
      className="card"
      role={onClick ? "button" : undefined}
      onClick={onClick || undefined}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div style={{ fontWeight: highlightTitle ? 600 : 500 }}>
        {task.title}
      </div>

      {task.description && <small>{task.description}</small>}
      {task.assignee && <small>Исполнитель: {task.assignee}</small>}
      {showCreatedAt && task.createdAt && (
        <small>создана {new Date(task.createdAt).toLocaleDateString("ru-RU")}</small>
      )}

      {actions}
    </div>
  );
}
