import { useState } from "react";

const STATUSES = [
  { id: "todo",        label: "ToDo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done",        label: "Done" },
];

export default function TaskCreate({ project, onCancel, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState("todo");
  const [touched, setTouched] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      assignee: assignee.trim(),
      status,
    });
  }

  const titleInvalid = touched && !title.trim();

  return (
    <section>
      <button onClick={onCancel} style={{ marginBottom: 12 }}>← К проекту</button>
      <h1>Новая задача</h1>
      <p style={{ color: "#666", marginTop: -6 }}>Проект: <b>{project.name}</b></p>

      <form className="form form-wide" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label htmlFor="title">Название *</label>
          <input
            id="title"
            placeholder="Например: Добавить авторизацию"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleInvalid}
          />
          {titleInvalid && <div className="field-error">Укажите название</div>}
        </div>

        <div className="form-row">
          <label htmlFor="desc">Описание</label>
          <textarea
            id="desc"
            rows={5}
            placeholder="Коротко опишите задачу"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-two">
          <div className="form-row">
            <label htmlFor="assignee">Исполнитель</label>
            <input
              id="assignee"
              placeholder="Имя исполнителя"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="status">Статус</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">Создать</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Отмена</button>
        </div>
      </form>
    </section>
  );
}
