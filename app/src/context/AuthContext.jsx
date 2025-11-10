// app/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { api, setAccessToken, refreshAccess } from "../utils/api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // если нет access — пробуем освежить
        if (!localStorage.getItem("access_token")) {
          await refreshAccess();
        }
        // если access есть — подтянуть профиль
        if (localStorage.getItem("access_token")) {
          const me = await api.me().catch(() => null);
          if (me) setUser(me);
        }
      } catch {}
    })();
  }, []);

  const login = async (login, password) => {
    const u = await api.login({ login, password }); // api вернёт { user }
    setUser(u);
  };
  const register = async (login, password) => {
    const u = await api.register({ login, password });
    setUser(u);
  };
  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
export const useAuth = () => useContext(AuthCtx);
