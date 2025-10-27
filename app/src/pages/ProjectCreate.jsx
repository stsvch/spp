import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext.jsx";

export default function ProjectCreate() {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useProjects();

  function handleSubmit(e) {
    e.preventDefault();
    const nm = name.trim();
    if (!nm) return;
    dispatch({ type: "PROJECT_ADD", payload: { name: nm } });
    navigate("/projects");
  }

  return (
    <section>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Назад</button>
      <h1>Новый проект</h1>

      <form className="form form-wide" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="pname">Название проекта *</label>
          <input id="pname" value={name} onChange={e => setName(e.target.value)} placeholder="Например: CRM система" />
        </div>
        <div className="form-actions">
          <button type="submit">Создать</button>
        </div>
      </form>
    </section>
  );
}
