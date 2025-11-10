// app/src/pages/TaskCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STATUSES = [
  { id: "todo",        label: "ToDo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done",        label: "Done" },
];

export default function TaskCreate() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { projects, addTask, updateTask, reloadProject } = useProjects();
  const { user } = useAuth();

  const project = projects.find(p => p.id === projectId);
  if (!project) return <p>Проект не найден.</p>;

  // право: админ или участник
  const canManage = user?.role === "admin" || (project.members ?? []).includes(user?.id);

  // если редактирование — найдём задачу
  const existing = useMemo(
    () => (taskId ? (project.tasks || []).find(t => t.id === taskId) : null),
    [project.tasks, taskId]
  );

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [assignee, setAssignee] = useState(existing?.assignee ?? "");
  const [status, setStatus] = useState(existing?.status ?? "todo");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
    setAssignee(existing?.assignee ?? "");
    setStatus(existing?.status ?? "todo");
  }, [existing?.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!canManage) {
      setError("Недостаточно прав. Задачи могут создавать администраторы или участники проекта.");
      return;
    }
    if (!title.trim()) return;

    try {
      if (existing) {
        await updateTask(projectId, existing.id, {
          title: title.trim(),
          description: description.trim(),
          assignee: assignee.trim(),
          status,
        });
      } else {
        await addTask(projectId, {
          title: title.trim(),
          description: description.trim(),
          assignee: assignee.trim(),
          status,
        });
      }
      // перезагрузим проект, чтобы точно увидеть свежие данные (если actions это уже делают — не страшно)
      await reloadProject(projectId);
      navigate(`/projects/${projectId}`);
    } catch (e) {
      setError(e.message || "Не удалось сохранить задачу");
    }
  }

  const titleInvalid = touched && !title.trim();
  const pageTitle = existing ? "Редактировать задачу" : "Новая задача";

  return (
    <section>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Назад</button>
      <h1>{pageTitle}</h1>
      <p style={{ color: "#666", marginTop: -6 }}>Проект: <b>{project.name}</b></p>

      {!canManage && (
        <div className="card" style={{ background: "#fff7f7", borderColor: "#f2caca", marginBottom: 12 }}>
          У вас нет прав на создание/редактирование задач в этом проекте.
        </div>
      )}

      <form className="form form-wide" onSubmit={handleSubmit} noValidate>
        {!!error && <div className="field-error" style={{ marginBottom: 10 }}>{error}</div>}

        <div className="form-row">
          <label htmlFor="title">Название *</label>
          <input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            aria-invalid={titleInvalid}
            disabled={!canManage}
          />
          {titleInvalid && <div className="field-error">Укажите название</div>}
        </div>

        <div className="form-row">
          <label htmlFor="desc">Описание</label>
          <textarea
            id="desc"
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={!canManage}
          />
        </div>

        <div className="form-two">
          <div className="form-row">
            <label htmlFor="assignee">Исполнитель</label>
            <input
              id="assignee"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              disabled={!canManage}
            />
          </div>

          <div className="form-row">
            <label htmlFor="status">Статус</label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              disabled={!canManage}
            >
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={!canManage}>{existing ? "Сохранить" : "Создать"}</button>
        </div>
      </form>
    </section>
  );
}
