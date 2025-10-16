import { useMemo } from "react";
import TaskCard from "../components/TaskCard.jsx";

const STATUSES = [
  { id: "todo",        label: "ToDo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done",        label: "Done" },
];

export default function Project({ project, onBack, onOpenCreateTask }) {
  const byStatus = useMemo(() => {
    const map = { "todo": [], "in-progress": [], "done": [] };
    for (const t of project.tasks ?? []) map[t.status]?.push(t);
    return map;
  }, [project.tasks]);

  return (
    <section>
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Назад к проектам</button>
      <h1>{project.name}</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={onOpenCreateTask}>+ Создать задачу</button>
      </div>

      <div className="board">
        {STATUSES.map(s => (
          <div key={s.id} className="column">
            <h3>{s.label}</h3>
            {(byStatus[s.id] ?? []).length
              ? byStatus[s.id].map(task => <TaskCard key={task.id} task={task} />)
              : <small>Нет задач</small>}
          </div>
        ))}
      </div>
    </section>
  );
}
