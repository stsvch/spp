import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <section className="page">
        <header className="page-header">
          <h1 className="page-title">Профиль</h1>
        </header>
        <p className="text-muted">Вы не авторизованы.</p>
        <div className="button-group">
          <Link to="/login" className="btn">Войти</Link>
          <Link to="/register" className="btn btn--ghost">Регистрация</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Профиль пользователя</h1>
      </header>

      <div className="card profile-card">
        <div className="profile-card__name">{user.login}</div>
        <div className="profile-card__role">
          <span className="text-muted">Роль:</span> {user.role === "admin" ? "Администратор" : "Участник команды"}
        </div>
        <div className="profile-card__meta">ID: {user.id}</div>
      </div>

      <div className="button-group">
        <button type="button" className="btn" onClick={logout}>Выйти</button>
      </div>

      <p className="text-muted profile-card__note">
        Права доступа: администратор может создавать/редактировать/удалять проекты и управлять пользователями; участник работает
        только в своих проектах.
      </p>
    </section>
  );
}
