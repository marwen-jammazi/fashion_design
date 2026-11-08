import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function AdminDashboard() {
  const [data, setData] = useState({ collections: [], projects: [], messages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/collections/admin/all"),
      api.get("/projects/admin/all"),
      api.get("/messages"),
    ])
      .then(([c, p, m]) =>
        setData({ collections: c.data, projects: p.data, messages: m.data })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading</p>;

  const { collections, projects, messages } = data;
  const unread = messages.filter((m) => !m.read).length;
  const drafts = [...collections, ...projects].filter((x) => !x.isPublished).length;

  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome back</h1>
        </div>
        <div className="row-actions">
          <Link to="/admin/collections" className="btn-sm">+ Collection</Link>
          <Link to="/admin/projects" className="btn-sm">+ Project</Link>
        </div>
      </div>

      <div className="admin-stats">
        <Link to="/admin/collections" className="glass admin-stat">
          <strong>{collections.length}</strong>
          <span>Collections</span>
        </Link>
        <Link to="/admin/projects" className="glass admin-stat">
          <strong>{projects.length}</strong>
          <span>Projects</span>
        </Link>
        <Link to="/admin/messages" className="glass admin-stat">
          <strong>{unread}</strong>
          <span>Unread messages</span>
        </Link>
        <div className="glass admin-stat">
          <strong>{drafts}</strong>
          <span>Hidden drafts</span>
        </div>
      </div>

      <h2 className="admin-sub">Latest messages</h2>
      {messages.length === 0 && <p className="muted">No messages yet.</p>}
      <div className="admin-list">
        {messages.slice(0, 3).map((m) => (
          <Link key={m._id} to="/admin/messages" className={m.read ? "msg" : "msg unread"}>
            <div className="msg-head">
              <strong>{!m.read && <i className="dot" />}{m.name}</strong>
              <span className="meta">{new Date(m.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="meta">{m.subject || m.message.slice(0, 80)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}