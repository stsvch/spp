import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx"; 

export default function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <section>
        <h1>Профиль</h1>
        <p>Вы не авторизованы.</p>
        <Link to="/login"><button>Войти</button></Link>
        <Link to="/register" style={{ marginLeft: 8 }}><button>Регистрация</button></Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Профиль пользователя</h1>

      <div className="card" style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{user.login}</div>
        <div><b>Роль:</b> {user.role === "admin" ? "Администратор" : "Участник команды"}</div>
        <div style={{ color: "#666", marginTop: 6 }}><small>ID: {user.id}</small></div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={logout}>Выйти</button>
      </div>

      <p style={{ color: "#666", marginTop: 16 }}>
        Права доступа: администратор может создавать/редактировать/удалять проекты и управлять пользователями; участник работает только в своих проектах.
      </p>
    </section>
  );
}
