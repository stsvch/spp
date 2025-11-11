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
    <div className="card">
      <div style={{ fontWeight: 500 }}>
        {task.title}
      </div>

      {task.description && <small>{task.description}</small>}
      {task.assignee && <small>Исполнитель: {task.assignee}</small>}

      {!!task.attachments?.length && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Файлы</div>
          <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
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
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
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
          {fileError && <div className="field-error" style={{ marginTop: 0 }}>{fileError}</div>}
        </div>
      )}

      {actions}
    </div>
  );
}
