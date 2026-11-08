import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import useAuth from "../context/useAuth";

export default function AdminLogin() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to="/admin" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Could not log in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={onSubmit} className="form login-card">
        <p className="eyebrow">Admin</p>
        <h1 className="page-title">Log in</h1>

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
          required
          autoFocus
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          required
        />

        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>

        {error && <p className="meta">{error}</p>}
        <Link to="/" className="meta">← Back to site</Link>
      </form>
    </div>
  );
}