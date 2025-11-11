import { useRef, useState } from "react";
import { api } from "../utils/api.js";

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
  const [downloadingId, setDownloadingId] = useState(null);

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

  async function handleDownload(file) {
    if (!file) return;
    const projectId = task.project ?? task.projectId;
    if (!projectId) {
      alert("Не удалось определить проект для файла");
      return;
    }

    try {
      setDownloadingId(file.id);
      const payload = await api.downloadTaskFile(projectId, task.id, file.id);
      const meta = payload?.file || file;
      const content = payload?.content;
      if (!content) throw new Error("Пустой ответ сервера");

      const binary = atob(content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: meta?.mimeType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = meta?.originalName || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.message || "Не удалось скачать файл");
    } finally {
      setDownloadingId(null);
    }
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
            {task.attachments.map(file => (
              <li key={file.id} className="task-card__attachment-item">
                <button
                  type="button"
                  className="task-card__attachment-link"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                >
                  {downloadingId === file.id ? "Скачивание..." : file.originalName}
                </button>
                <span className="task-card__attachment-size">({formatSize(file.size)})</span>
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
            ))}
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
