import { useState } from "react";
import api from "../api/client";
import useAuth from "../context/useAuth";

const empty = { currentPassword: "", newPassword: "", confirm: "" };

export default function AdminSettings() {
  const { admin, updateToken } = useAuth();
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8)
      return setStatus({ type: "error", text: "Use at least 8 characters" });
    if (form.newPassword !== form.confirm)
      return setStatus({ type: "error", text: "The two new passwords do not match" });

    setBusy(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await api.put("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      if (res.data.token) updateToken(res.data.token);
      setForm(empty);
      setStatus({ type: "ok", text: "Password updated." });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Could not update the password",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
        </div>
      </div>

      <form onSubmit={onSubmit} className="form admin-form narrow">
        <h2 className="full">Change password</h2>
        <p className="meta full">Logged in as {admin?.email}</p>

        <label className="field">
          <span>Current password</span>
          <input
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={onChange}
            autoComplete="current-password"
            required
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="field">
          <span>Repeat new password</span>
          <input
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
        </label>

        {status.text && (
          <p className={status.type === "error" ? "form-error" : "meta"}>{status.text}</p>
        )}
        <div className="form-actions">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Saving..." : "Update password"}
          </button>
        </div>
      </form>
    </>
  );
}