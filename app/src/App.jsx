import { useState } from "react";
import Nav from "./components/Nav.jsx";
import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import UserProfile from "./pages/UserProfile.jsx";

const PAGES = { home: <Home />, projects: <Projects />, profile: <UserProfile /> };

export default function App() {
  const [current, setCurrent] = useState("home");
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <Nav current={current} onNavigate={setCurrent} />
      <main style={{ padding: "1rem" }}>{PAGES[current]}</main>
    </div>
  );
}
