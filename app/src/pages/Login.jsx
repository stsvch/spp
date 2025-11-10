import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(form.login, form.password);
      nav("/projects");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section>
      <h1>Вход</h1>
      <form className="form form-wide" onSubmit={submit}>
        <div className="form-row">
          <label>Логин</label>
          <input value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))}/>
        </div>
        <div className="form-row">
          <label>Пароль</label>
          <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
        </div>
        {err && <div className="field-error">{err}</div>}
        <div className="form-actions"><button>Войти</button></div>
        <p>Нет аккаунта? <Link to="/register">Регистрация</Link></p>
      </form>
    </section>
  );
}
