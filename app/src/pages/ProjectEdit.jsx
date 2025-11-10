// app/src/pages/ProjectEdit.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext.jsx";

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, reloadProject, updateProject } = useProjects();

  const existing = projects.find(p => p.id === id);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!existing) {
      reloadProject(id).then(p => {
        setName(p?.name ?? "");
        setDescription(p?.description ?? "");
      }).catch(() => {});
    }
  }, [id]); // eslint-disable-line

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const nm = name.trim();
    try {
      if (!nm) throw new Error("Укажите название");
      await updateProject(id, { name: nm, description });
      navigate(`/projects/${id}`);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Назад</button>
      <h1>Редактирование проекта</h1>

      <form className="form form-wide" onSubmit={submit}>
        <div className="form-row">
          <label htmlFor="pname">Название проекта *</label>
          <input id="pname" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <label htmlFor="pdesc">Описание</label>
          <textarea id="pdesc" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {err && <div className="field-error" style={{ marginTop: 8 }}>{err}</div>}
        <div className="form-actions"><button type="submit">Сохранить</button></div>
      </form>
    </section>
  );
}
