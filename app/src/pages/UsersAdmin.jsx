// app/src/pages/UsersAdmin.jsx
import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listUsers();
        setUsers(list);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Пользователи</h1>
      </header>
      {err && <div className="field-error field-error--block">{err}</div>}
      {users.length === 0 ? (
        <p className="text-muted">Пока нет пользователей.</p>
      ) : (
        <div className="user-grid">
          {users.map(u => (
            <div key={u.id} className="card user-card">
              <div className="user-card__name">{u.login}</div>
              <div className="user-card__meta">Роль: {u.role}</div>
              <div className="user-card__meta">ID: {u.id}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
