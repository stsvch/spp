import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import TaskCard from "../components/TaskCard.jsx";

const STATUS_ORDER = ["todo", "in-progress", "done"];

export default function MyTasks() {
  const { user } = useAuth();
  const { projects, fetchProjects } = useProjects();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    // гарантируем, что проекты подтянуты
    fetchProjects().catch(console.error);
  }, [fetchProjects]);

  const items = useMemo(() => {
    const all = projects.flatMap(p =>
      (p.tasks || []).map(t => ({
        ...t,
        projectName: p.name,
        projectId: p.id,
      }))
    );
    const mine = all.filter(t => (t.assignee || "").toLowerCase() === (user?.login || "").toLowerCase());

    return mine
      .filter(t => (statusFilter === "all" ? true : t.status === statusFilter))
      .filter(t => (query.trim() ? (t.title + " " + (t.description || "")).toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }, [projects, user?.login, statusFilter, query]);

  return (
    <section>
      <h1>Мои задачи</h1>

      <div className="card" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input
          placeholder="Поиск по названию/описанию"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Все статусы</option>
          <option value="todo">ToDo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p>У вас пока нет задач.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {items.map(t => (
            <TaskCard
              key={`${t.projectId}:${t.id}`}
              task={t}
              onClick={() => navigate(`/projects/${t.projectId}/tasks/${t.id}`)}
              actions={(
                <div style={{ marginTop: 6, color: "#666" }}>
                  <small>Проект: <Link to={`/projects/${t.projectId}`}>{t.projectName}</Link></small>
                </div>
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
