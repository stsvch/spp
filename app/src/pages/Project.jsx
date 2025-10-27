import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TaskCard from "../components/TaskCard.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";

const STATUSES = [
  { id: "todo",        label: "ToDo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done",        label: "Done" },
];

export default function Project() {
  const { id } = useParams();                
  const navigate = useNavigate();
  const { projects, dispatch } = useProjects();

  const project = projects.find(p => p.id === id);
  if (!project) return <p>Проект не найден.</p>;

  const byStatus = useMemo(() => {
    const map = { "todo": [], "in-progress": [], "done": [] };
    for (const t of project.tasks ?? []) map[t.status]?.push(t);
    return map;
  }, [project.tasks]);

  function handleDelete(taskId) {
    dispatch({ type: "TASK_DELETE", payload: { projectId: project.id, taskId } });
  }

  return (
    <section>
      <button onClick={() => navigate("/projects")} style={{ marginBottom: 12 }}>← К проектам</button>
      <h1>{project.name}</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to={`/projects/${project.id}/new-task`}><button>+ Создать задачу</button></Link>
      </div>

      <div className="board">
        {STATUSES.map(s => (
          <div key={s.id} className="column">
            <h3>{s.label}</h3>
            {(byStatus[s.id] ?? []).length
              ? byStatus[s.id].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    actions={(
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <Link to={`/projects/${project.id}/edit-task/${task.id}`}><button>Редактировать</button></Link>
                        <button onClick={() => handleDelete(task.id)}>Удалить</button>
                      </div>
                    )}
                  />
                ))
              : <small>Нет задач</small>}
          </div>
        ))}
      </div>
    </section>
  );
}
