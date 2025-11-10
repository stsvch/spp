// app/src/components/Nav.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Nav() {
  const { user, logout } = useAuth();

  const linkStyle = ({ isActive }) => ({
    padding: "0.5rem 0.75rem",
    borderBottom: isActive ? "2px solid black" : "2px solid transparent",
    textDecoration: "none",
    color: "inherit",
    fontWeight: isActive ? 700 : 400,
  });

  return (
    <header style={{
      display: "flex", gap: "0.5rem", alignItems: "center",
      borderBottom: "1px solid #eee", padding: "0.5rem 1rem",
    }}>
      <strong style={{ marginRight: "1rem" }}>TaskBoard</strong>

      <nav style={{ display: "flex", gap: "0.25rem" }}>
        <NavLink to="/" style={linkStyle} end>Главная</NavLink>
        <NavLink to="/projects" style={linkStyle}>Проекты</NavLink>
        <NavLink to="/profile" style={linkStyle}>Профиль</NavLink>
        {user?.role === "admin" && (
          <NavLink to="/admin/users" style={linkStyle}>Пользователи</NavLink>
        )}
      </nav>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        {user ? (
          <>
            <span style={{ color: "#555" }}>{user.login} ({user.role})</span>
            <button onClick={logout}>Выйти</button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={linkStyle}>Войти</NavLink>
            <NavLink to="/register" style={linkStyle}>Регистрация</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
