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
    <section>
      <h1>Пользователи</h1>
      {err && <div className="field-error" style={{ marginBottom: 12 }}>{err}</div>}
      {users.length === 0 ? (
        <p>Пока нет пользователей.</p>
      ) : (
        <div style={{ maxWidth: 720 }}>
          {users.map(u => (
            <div key={u.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{u.login}</div>
              <small>Роль: {u.role}</small>
              <div><small>ID: {u.id}</small></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
