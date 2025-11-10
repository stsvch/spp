// app/src/pages/Home.jsx
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import TaskCard from "../components/TaskCard.jsx";
import ProjectList from "../components/ProjectList.jsx";

const STATUSES = [
  { id: "todo",        label: "ToDo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done",        label: "Done" },
];

export default function Home() {
  const { user } = useAuth();
  const { projects, fetchProjects, reloadProject } = useProjects();
  const navigate = useNavigate();

  // 1) при первом заходе — загрузить список проектов
  useEffect(() => {
    if (!projects.length) {
      fetchProjects().catch(console.error);
    }
  }, [projects.length, fetchProjects]);

  // 2) подтянуть задачи для тех проектов, где их ещё нет
  useEffect(() => {
    if (!user || !projects.length) return;

    const myProjects = user.role === "admin"
      ? projects
      : projects.filter(p => (p.members ?? []).includes(user.id));

    // у списка проектов, полученного /projects, задач нет (есть только tasksCount).
    // подгружаем полные данные проекта (с задачами) только где нужно.
    myProjects
      .filter(p => !Array.isArray(p.tasks)) // где задач ещё нет
      .forEach(p => reloadProject(p.id).catch(console.error));
  }, [user, projects, reloadProject]);

  // 3) считаем "мои" задачи (по логину исполнителя) и группируем по статусам
  const byStatus = useMemo(() => {
    const map = { "todo": [], "in-progress": [], "done": [] };
    if (!user) return map;

    const lowerLogin = String(user.login).toLowerCase();

    // админ видит задачи всех проектов; участник — только своих
    const allowedProjects = user.role === "admin"
      ? projects
      : projects.filter(p => (p.members ?? []).includes(user.id));

    for (const p of allowedProjects) {
      const tasks = Array.isArray(p.tasks) ? p.tasks : [];
      for (const t of tasks) {
        const assignee = String(t.assignee || "").toLowerCase();
        if (assignee && assignee === lowerLogin) {
          map[t.status]?.push({ ...t, projectId: p.id, projectName: p.name });
        }
      }
    }
    return map;
  }, [projects, user]);

  return (
    <section>
      <h1>Главная</h1>

      {!user ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <p>Вы не авторизованы.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/login"><button>Войти</button></Link>
            <Link to="/register"><button>Регистрация</button></Link>
          </div>
        </div>
      ) : (
        <>
          {/* Мои задачи */}
          <h2 style={{ marginTop: 12 }}>Мои задачи</h2>
          <div className="board">
            {STATUSES.map(s => (
              <div key={s.id} className="column">
                <h3>{s.label}</h3>
                {(byStatus[s.id] ?? []).length ? (
                  byStatus[s.id].map(task => {
                    const projectRef = projects.find(p => p.id === task.projectId);
                    const canManageTask = user.role === "admin" || (projectRef?.members ?? []).includes(user.id);
                    return (
                      <TaskCard
                        key={task.id}
                        projectId={task.projectId}
                        task={task}
                        canManage={canManageTask}
                        onChanged={() => reloadProject(task.projectId)}
                        actions={
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button onClick={() => navigate(`/projects/${task.projectId}`)}>
                              Открыть проект
                            </button>
                            <Link to={`/projects/${task.projectId}/edit-task/${task.id}`}>
                              <button>Редактировать</button>
                            </Link>
                          </div>
                        }
                      />
                    );
                  })
                ) : (
                  <small>Нет задач</small>
                )}
              </div>
            ))}
          </div>

          {/* Мои проекты (кликабельные карточки, как и раньше) */}
          <h2 style={{ marginTop: 20 }}>Мои проекты</h2>
          <ProjectList
            projects={
              user.role === "admin"
                ? projects
                : projects.filter(p => (p.members ?? []).includes(user.id))
            }
            onOpenProject={(id) => navigate(`/projects/${id}`)}
          />
        </>
      )}
    </section>
  );
}
