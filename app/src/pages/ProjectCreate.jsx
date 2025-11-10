import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext.jsx";

export default function ProjectCreate() {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { createProject } = useProjects();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    const nm = name.trim();
    if (!nm) return;
    try {
      await createProject({ name: nm });
      navigate("/projects");
    } catch (e) {
      setErr(e.message);
    }
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
        {err && <div className="field-error" style={{ marginTop: 8 }}>{err}</div>}
        <div className="form-actions">
          <button type="submit">Создать</button>
        </div>
      </form>
    </section>
  );
}
