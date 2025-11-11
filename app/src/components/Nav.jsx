// app/src/components/Nav.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Nav() {
  const { user, logout } = useAuth();

  const makeLinkClass = ({ isActive }) => (
    `nav-link${isActive ? " nav-link--active" : ""}`
  );

  return (
    <header className="app-header">
      <div className="app-container app-header__inner">
        <span className="app-header__brand">TaskBoard</span>

        <nav className="app-header__nav">
          <NavLink to="/" className={makeLinkClass} end>Главная</NavLink>
          <NavLink to="/projects" className={makeLinkClass}>Проекты</NavLink>
          <NavLink to="/profile" className={makeLinkClass}>Профиль</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin/users" className={makeLinkClass}>Пользователи</NavLink>
          )}
        </nav>

        <div className="app-header__auth">
          {user ? (
            <>
              <span className="app-header__user">{user.login} ({user.role})</span>
              <button type="button" className="btn btn--ghost" onClick={logout}>Выйти</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={makeLinkClass}>Войти</NavLink>
              <NavLink to="/register" className={makeLinkClass}>Регистрация</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
