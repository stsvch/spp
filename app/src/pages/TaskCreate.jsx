import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext.jsx";

const STATUSES = [
  { id: "todo",        label: "ToDo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done",        label: "Done" },
];

export default function TaskCreate() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { projects, dispatch } = useProjects();

  const project = projects.find(p => p.id === projectId);
  if (!project) return <p>Проект не найден.</p>;

  const existing = project.tasks.find(t => t.id === taskId);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [assignee, setAssignee] = useState(existing?.assignee ?? "");
  const [status, setStatus] = useState(existing?.status ?? "todo");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
    setAssignee(existing?.assignee ?? "");
    setStatus(existing?.status ?? "todo");
  }, [existing?.id]);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!title.trim()) return;

    if (existing) {
      dispatch({
        type: "TASK_UPDATE",
        payload: {
          projectId,
          taskId,
          patch: {
            title: title.trim(),
            description: description.trim(),
            assignee: assignee.trim(),
            status,
          },
        },
      });
    } else {
      dispatch({
        type: "TASK_ADD",
        payload: {
          projectId,
          task: {
            title: title.trim(),
            description: description.trim(),
            assignee: assignee.trim(),
            status,
          },
        },
      });
    }
    navigate(`/projects/${projectId}`);
  }

  const titleInvalid = touched && !title.trim();
  const pageTitle = existing ? "Редактировать задачу" : "Новая задача";

  return (
    <section>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Назад</button>
      <h1>{pageTitle}</h1>
      <p style={{ color: "#666", marginTop: -6 }}>Проект: <b>{project.name}</b></p>

      <form className="form form-wide" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label htmlFor="title">Название *</label>
          <input id="title" value={title} onChange={e => setTitle(e.target.value)} aria-invalid={titleInvalid} />
          {titleInvalid && <div className="field-error">Укажите название</div>}
        </div>

        <div className="form-row">
          <label htmlFor="desc">Описание</label>
          <textarea id="desc" rows={5} value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="form-two">
          <div className="form-row">
            <label htmlFor="assignee">Исполнитель</label>
            <input id="assignee" value={assignee} onChange={e => setAssignee(e.target.value)} />
          </div>

          <div className="form-row">
            <label htmlFor="status">Статус</label>
            <select id="status" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">{existing ? "Сохранить" : "Создать"}</button>
        </div>
      </form>
    </section>
  );
}
