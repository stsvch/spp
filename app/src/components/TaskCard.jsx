import { useId, useState } from "react";
import { api } from "../utils/api.js";

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export default function TaskCard({ projectId, task, canManage = false, onChanged, actions = null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputId = useId();

  if (!task) return null;

  const attachments = task.attachments ?? [];

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      await api.uploadTaskFile(projectId, task.id, file);
      if (typeof onChanged === "function") await onChanged();
    } catch (err) {
      setError(err.message || "Не удалось загрузить файл");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(fileId) {
    if (!confirm("Удалить файл из задачи?")) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteTaskFile(projectId, task.id, fileId);
      if (typeof onChanged === "function") await onChanged();
    } catch (err) {
      setError(err.message || "Не удалось удалить файл");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(file) {
    setError("");
    try {
      const { blob, filename } = await api.downloadTaskFile(projectId, task.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || file.originalName || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || "Не удалось скачать файл");
    }
  }

  return (
    <div className="card task-card">
      <div style={{ fontWeight: 500 }}>
        {task.title}
      </div>

      {task.description && <small>{task.description}</small>}
      {task.assignee && <small>Исполнитель: {task.assignee}</small>}

      {attachments.length > 0 && (
        <div className="task-files">
          <div className="task-files__title">Файлы</div>
          <ul className="task-files__list">
            {attachments.map(file => (
              <li key={file.id} className="task-files__item">
                <div className="task-files__meta">
                  <span className="task-files__name">{file.originalName}</span>
                  {file.size ? <small className="task-files__size">{formatSize(file.size)}</small> : null}
                </div>
                <div className="task-files__buttons">
                  <button type="button" onClick={() => handleDownload(file)}>
                    Скачать
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(file.id)}
                      disabled={busy}
                      style={{ background: "#ffe9e9", borderColor: "#f2c6c6" }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage && (
        <div className="task-files__upload">
          <label className="task-files__upload-label" htmlFor={fileInputId}>
            <input
              id={fileInputId}
              type="file"
              onChange={handleUpload}
              disabled={busy}
            />
            <span>{busy ? "Загрузка…" : "Прикрепить файл"}</span>
          </label>
        </div>
      )}

      {error && <div className="field-error" style={{ marginTop: 8 }}>{error}</div>}

      {actions}
    </div>
  );
}
