import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await register(form.login, form.password);
      nav("/projects");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section className="page page--centered">
      <header className="page-header">
        <h1 className="page-title">Регистрация</h1>
        <p className="text-muted">Создайте аккаунт, чтобы управлять проектами и задачами.</p>
      </header>
      <form className="form form-card" onSubmit={submit}>
        <div className="form-row">
          <label htmlFor="login">Логин</label>
          <input id="login" value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))}/>
        </div>
        <div className="form-row">
          <label htmlFor="password">Пароль</label>
          <input id="password" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
        </div>
        {err && <div className="field-error field-error--block">{err}</div>}
        <div className="form-actions"><button type="submit">Создать</button></div>
        <p className="text-muted">Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      </form>
    </section>
  );
}
