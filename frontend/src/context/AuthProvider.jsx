import { useEffect, useState } from "react";
import api from "../api/client";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem("token"));

  // on page load, check that the saved token is still valid
  useEffect(() => {
    if (!token) return;
    api
      .get("/auth/me")
      .then((res) => setAdmin(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setAdmin(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setAdmin(res.data.admin);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}