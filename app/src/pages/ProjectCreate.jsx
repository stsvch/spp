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
    <section className="page">
      <button type="button" className="btn btn--ghost page-back" onClick={() => navigate(-1)}>← Назад</button>
      <header className="page-header">
        <h1 className="page-title">Новый проект</h1>
      </header>

      <form className="form form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="pname">Название проекта *</label>
          <input id="pname" value={name} onChange={e => setName(e.target.value)} placeholder="Например: CRM система" />
        </div>
        {err && <div className="field-error field-error--block">{err}</div>}
        <div className="form-actions">
          <button type="submit">Создать</button>
        </div>
      </form>
    </section>
  );
}
