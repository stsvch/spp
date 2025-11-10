import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import TaskCard from "../components/TaskCard.jsx";

export default function TaskView() {
  const { id: projectId, taskId } = useParams();
  const { projects, deleteTask, reloadProject } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();

  const project = projects.find(p => p.id === projectId);
  if (!project) return <p>Проект не найден.</p>;

  const task = useMemo(() => (project.tasks || []).find(t => t.id === taskId), [project.tasks, taskId]);
  if (!task) return <p>Задача не найдена.</p>;

  const canManage = user?.role === "admin" || (project.members ?? []).includes(user?.id);

  async function remove() {
    if (!canManage) return;
    if (!confirm("Удалить задачу?")) return;
    await deleteTask(project.id, task.id);
    await reloadProject(project.id);
    navigate(`/projects/${project.id}`);
  }

  return (
    <section>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Назад</button>
      <h1>Задача</h1>
      <p style={{ color: "#666", marginTop: -6 }}>Проект: <b>{project.name}</b></p>

      <TaskCard task={task} highlightTitle showCreatedAt />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {canManage && (
          <>
            <Link to={`/projects/${project.id}/tasks/${task.id}/edit`}><button>Редактировать</button></Link>
            <button onClick={remove}>Удалить</button>
          </>
        )}
        <Link to={`/projects/${project.id}`}><button>К доске проекта</button></Link>
      </div>
    </section>
  );
}
