export default function Nav({ current, onNavigate }) {
  const Item = ({ id, children }) => (
    <button
      onClick={() => onNavigate(id)}
      style={{
        padding: "0.5rem 0.75rem",
        border: "none",
        borderBottom: current === id ? "2px solid black" : "2px solid transparent",
        background: "transparent",
        cursor: "pointer",
        fontWeight: current === id ? 700 : 400,
      }}
    >
      {children}
    </button>
  );

  return (
    <header
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        borderBottom: "1px solid #eee",
        padding: "0.5rem 1rem",
      }}
    >
      <strong style={{ marginRight: "1rem" }}>TaskBoard</strong>
      <nav style={{ display: "flex", gap: "0.25rem" }}>
        <Item id="home">Главная</Item>
        <Item id="projects">Проекты</Item>
        <Item id="profile">Профиль пользователя</Item>
      </nav>
    </header>
  );
}
