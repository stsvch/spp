import { useRef } from "react";
import { getAccessToken } from "../utils/api.js";

export default function TaskCard({
  task,
  actions = null,
  canManage = false,
  uploading = false,
  fileError = "",
  onUploadFile = null,
  onDeleteFile = null,
}) {
  if (!task) return null;

  const inputRef = useRef(null);
  const token = getAccessToken();

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
    e.target.value = "";
  }

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  }

  return (
    <div className="card task-card">
      <div className="task-card__title">{task.title}</div>

      {task.description && <div className="task-card__description">{task.description}</div>}
      {task.assignee && <div className="task-card__meta">Исполнитель: {task.assignee}</div>}

      {!!task.attachments?.length && (
        <div className="task-card__attachments">
          <div className="task-card__attachments-title">Файлы</div>
          <ul className="task-card__attachments-list">
            {task.attachments.map(file => {
              const url = token
                ? `${file.downloadUrl}${file.downloadUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
                : file.downloadUrl;
              return (
                <li key={file.id} className="task-card__attachment-item">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="task-card__attachment-link">
                    {file.originalName}
                  </a>
                  <span className="task-card__attachment-size">({formatSize(file.size)})</span>
                  {canManage && onDeleteFile && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs"
                      onClick={() => onDeleteFile(file.id)}
                    >
                      Удалить
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {canManage && onUploadFile && (
        <div className="task-card__upload">
          <input
            ref={inputRef}
            type="file"
            className="task-card__upload-input"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Загрузка..." : "Прикрепить файл"}
          </button>
          {fileError && <div className="field-error field-error--inline">{fileError}</div>}
        </div>
      )}

      {actions && <div className="task-card__actions">{actions}</div>}
    </div>
  );
}
