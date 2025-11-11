// app/src/pages/Project.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TaskCard from "../components/TaskCard.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../utils/api.js";

const STATUSES = [
  { id: "todo",        label: "ToDo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done",        label: "Done" },
];

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    deleteTask,
    reloadProject,
    deleteProject,
    uploadTaskFile,
    deleteTaskFile,
  } = useProjects();
  const { user } = useAuth();

  const [allUsers, setAllUsers] = useState([]);       // для добавления участников (только админ)
  const [opErr, setOpErr] = useState("");
  const [fileErrors, setFileErrors] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadError, setLoadError] = useState("");

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (!id) return;
    const hasFullTasks = Array.isArray(project?.tasks);
    if (project && hasFullTasks) return;

    let ignore = false;
    setLoadError("");
    setLoadingProject(true);
    reloadProject(id)
      .catch(err => {
        if (!ignore) setLoadError(err?.message || "Не удалось загрузить проект");
      })
      .finally(() => {
        if (!ignore) setLoadingProject(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, project?.id, project?.tasks, reloadProject]);

  const isAdmin = user?.role === "admin";
  const isMember = (project?.members ?? []).includes(user?.id);
  const canManage = isAdmin || isMember;

  const byStatus = useMemo(() => {
    const map = { "todo": [], "in-progress": [], "done": [] };
    for (const t of project?.tasks ?? []) map[t.status]?.push(t);
    return map;
  }, [project?.tasks]);

  // загрузим список пользователей для селекта участника (только для админа)
  useEffect(() => {
    if (!isAdmin) return;
    api.listUsers().then(setAllUsers).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    const ids = new Set((project?.tasks || []).map(t => t.id));
    setFileErrors(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => ids.has(key))));
    setUploadingFiles(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => ids.has(key))));
  }, [project?.tasks]);

  if (!project) {
    return (
      <section className="page">
        <button type="button" className="btn btn--ghost page-back" onClick={() => navigate("/projects")}>
          ← К проектам
        </button>
        {loadingProject && <p>Загрузка проекта…</p>}
        {!loadingProject && loadError && (
          <div className="field-error field-error--block">{loadError}</div>
        )}
        {!loadingProject && !loadError && <p>Проект не найден.</p>}
      </section>
    );
  }

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(project.id, taskId);
    } catch (e) {
      alert(e.message || "Не удалось удалить задачу");
    }
  }

  async function handleUploadFile(taskId, file) {
    if (!file) return;
    setFileErrors(prev => ({ ...prev, [taskId]: "" }));
    setUploadingFiles(prev => ({ ...prev, [taskId]: true }));
    try {
      await uploadTaskFile(project.id, taskId, file);
    } catch (e) {
      setFileErrors(prev => ({ ...prev, [taskId]: e.message || "Не удалось загрузить файл" }));
    } finally {
      setUploadingFiles(prev => ({ ...prev, [taskId]: false }));
    }
  }

  async function handleDeleteFile(taskId, fileId) {
    setFileErrors(prev => ({ ...prev, [taskId]: "" }));
    try {
      await deleteTaskFile(project.id, taskId, fileId);
    } catch (e) {
      setFileErrors(prev => ({ ...prev, [taskId]: e.message || "Не удалось удалить файл" }));
    }
  }

  async function handleDeleteProject() {
    if (!confirm("Удалить проект и все его задачи?")) return;
    try {
      await deleteProject(project.id);
      navigate("/projects");
    } catch (e) {
      setOpErr(e.message);
    }
  }

  // управление участниками (admin)
  async function addMember(userId) {
    try {
      await api.addMember(project.id, userId);
      await reloadProject(project.id);
    } catch (e) {
      setOpErr(e.message);
    }
  }
  async function removeMember(userId) {
    try {
      await api.removeMember(project.id, userId);
      await reloadProject(project.id);
    } catch (e) {
      setOpErr(e.message);
    }
  }

  const membersSet = new Set(project.members?.map(String) ?? []);
  const candidates = allUsers.filter(u => !membersSet.has(String(u.id)));

  return (
    <section className="page">
      <button type="button" className="btn btn--ghost page-back" onClick={() => navigate("/projects")}>← К проектам</button>
      <header className="page-header">
        <h1 className="page-title">{project.name}</h1>
        {project.description && <p className="text-muted page-subtitle">{project.description}</p>}
      </header>
      {opErr && <div className="field-error field-error--block">{opErr}</div>}

      <div className="button-group button-group--wrap page-actions">
        {canManage && (
          <Link to={`/projects/${project.id}/new-task`} className="btn">+ Создать задачу</Link>
        )}
        {isAdmin && (
          <>
            <Link to={`/projects/${project.id}/edit`} className="btn btn--ghost">Редактировать проект</Link>
            <button type="button" className="btn btn--danger" onClick={handleDeleteProject}>
              Удалить проект
            </button>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="card project-panel">
          <div className="project-panel__title">Участники</div>
          {project.members?.length ? (
            <ul className="project-panel__list">
              {project.members.map(uid => {
                const u = allUsers.find(x => String(x.id) === String(uid));
                return (
                  <li key={uid} className="project-panel__list-item">
                    <span>{u ? `${u.login} (${u.role})` : uid}</span>
                    <button type="button" className="btn btn--ghost btn--xs" onClick={() => removeMember(uid)}>
                      Удалить
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <small className="text-muted">Пока нет участников</small>}

          {!!candidates.length && (
            <div className="project-panel__controls">
              <select id="member-select" defaultValue="">
                <option value="" disabled>Выберите пользователя…</option>
                {candidates.map(u => (
                  <option key={u.id} value={u.id}>{u.login} ({u.role})</option>
                ))}
              </select>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const sel = document.getElementById("member-select");
                  if (sel?.value) addMember(sel.value);
                }}
              >
                Добавить
              </button>
            </div>
          )}
        </div>
      )}

      <div className="board">
        {STATUSES.map(s => (
          <div key={s.id} className="column">
            <h3 className="column__title">{s.label}</h3>
            {(byStatus[s.id] ?? []).length
              ? byStatus[s.id].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canManage={canManage}
                    uploading={Boolean(uploadingFiles[task.id])}
                    fileError={fileErrors[task.id]}
                    onUploadFile={file => handleUploadFile(task.id, file)}
                    onDeleteFile={fileId => handleDeleteFile(task.id, fileId)}
                    actions={canManage ? (
                      <div className="button-group button-group--wrap">
                        <Link to={`/projects/${project.id}/edit-task/${task.id}`} className="btn btn--ghost btn--xs">
                          Редактировать
                        </Link>
                        <button type="button" className="btn btn--ghost btn--xs" onClick={() => handleDeleteTask(task.id)}>
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  />
                ))
              : <small className="text-muted">Нет задач</small>}
          </div>
        ))}
      </div>
    </section>
  );
}
