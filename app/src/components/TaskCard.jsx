import { useRef } from "react";
import { getAccessToken, resolveDownloadUrl } from "../utils/api.js";

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
              const href = resolveDownloadUrl(file.downloadUrl, token);
              return (
                <li key={file.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {file.originalName}
                  </a>
                  <small style={{ color: "#666" }}>({formatSize(file.size)})</small>
                  {canManage && onDeleteFile && (
                    <button
                      type="button"
                      onClick={() => onDeleteFile(file.id)}
                      style={{ padding: "2px 6px", fontSize: 12 }}
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
