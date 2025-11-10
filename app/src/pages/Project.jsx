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
  const { projects, deleteTask, reloadProject, deleteProject } = useProjects();
  const { user } = useAuth();

  const [allUsers, setAllUsers] = useState([]);       // для добавления участников (только админ)
  const [opErr, setOpErr] = useState("");

  const project = projects.find(p => p.id === id);
  useEffect(() => { if (!project) reloadProject(id).catch(() => {}); }, [id]); // на прямой переход
  if (!project) return <p>Проект не найден.</p>;

  const isAdmin = user?.role === "admin";
  const isMember = (project.members ?? []).includes(user?.id);
  const canManage = isAdmin || isMember;

  const byStatus = useMemo(() => {
    const map = { "todo": [], "in-progress": [], "done": [] };
    for (const t of project.tasks ?? []) map[t.status]?.push(t);
    return map;
  }, [project.tasks]);

  // загрузим список пользователей для селекта участника (только для админа)
  useEffect(() => {
    if (!isAdmin) return;
    api.listUsers().then(setAllUsers).catch(() => {});
  }, [isAdmin]);

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(project.id, taskId);
      await reloadProject(project.id);
    } catch (e) {
      alert(e.message || "Не удалось удалить задачу");
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
    <section>
      <button onClick={() => navigate("/projects")} style={{ marginBottom: 12 }}>← К проектам</button>
      <h1>{project.name}</h1>
      {project.description && <p style={{ color: "#666", marginTop: -6 }}>{project.description}</p>}
      {opErr && <div className="field-error" style={{ marginBottom: 12 }}>{opErr}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        {canManage && (
          <Link to={`/projects/${project.id}/new-task`}><button>+ Создать задачу</button></Link>
        )}
        {isAdmin && (
          <>
            <Link to={`/projects/${project.id}/edit`}><button>Редактировать проект</button></Link>
            <button onClick={handleDeleteProject} style={{ background: "#ffe9e9", borderColor: "#f1c1c1" }}>
              Удалить проект
            </button>
          </>
        )}
      </div>

      {/* Блок участников проекта (только для админа) */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Участники</div>
          {project.members?.length ? (
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {project.members.map(uid => {
                const u = allUsers.find(x => String(x.id) === String(uid));
                return (
                  <li key={uid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{u ? `${u.login} (${u.role})` : uid}</span>
                    <button onClick={() => removeMember(uid)}>Удалить</button>
                  </li>
                );
              })}
            </ul>
          ) : <small>Пока нет участников</small>}

          {!!candidates.length && (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <select id="member-select" defaultValue="">
                <option value="" disabled>Выберите пользователя…</option>
                {candidates.map(u => (
                  <option key={u.id} value={u.id}>{u.login} ({u.role})</option>
                ))}
              </select>
              <button onClick={() => {
                const sel = document.getElementById("member-select");
                if (sel?.value) addMember(sel.value);
              }}>Добавить</button>
            </div>
          )}
        </div>
      )}

      <div className="board">
  {STATUSES.map(s => (
    <div key={s.id} className="column">
      <h3>{s.label}</h3>
      {(byStatus[s.id] ?? []).length
        ? byStatus[s.id].map(task => (
            <TaskCard
              key={task.id}
              task={task}
              actions={canManage ? (
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <Link to={`/projects/${project.id}/edit-task/${task.id}`}>
                    <button type="button">Редактировать</button>
                  </Link>
                  <button type="button" onClick={() => handleDeleteTask(task.id)}>
                    Удалить
                  </button>
                </div>
              ) : null}
            />
          ))
        : <small>Нет задач</small>}
    </div>
  ))}
</div>

    </section>
  );
}
