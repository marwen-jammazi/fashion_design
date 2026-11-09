import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { CountdownText } from "../components/Countdown";

const safe = (req, fallback) => req.catch(() => ({ data: fallback }));

export default function AdminDashboard() {
  const [data, setData] = useState({
    collections: [],
    projects: [],
    events: [],
    messages: [],
    profile: {},
  });
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

  useEffect(() => {
    Promise.all([
      safe(api.get("/collections/admin/all"), []),
      safe(api.get("/projects/admin/all"), []),
      safe(api.get("/events/admin/all"), []),
      safe(api.get("/messages"), []),
      safe(api.get("/profile"), {}),
    ])
      .then(([c, p, ev, m, pr]) =>
        setData({
          collections: c.data,
          projects: p.data,
          events: ev.data,
          messages: m.data,
          profile: pr.data,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading</p>;

  const { collections, projects, events, messages, profile } = data;
  const unread = messages.filter((m) => !m.read).length;
  const upcoming = events
    .filter((e) => e.state !== "ended")
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const pending = upcoming.reduce((sum, e) => sum + (e.applicants?.pending || 0), 0);

  const hour = now.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.name?.split(" ")[0];
  const today = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const alerts = [];
  if (pending > 0) alerts.push(`${pending} application${pending > 1 ? "s" : ""} waiting for approval`);
  if (unread > 0) alerts.push(`${unread} unread message${unread > 1 ? "s" : ""}`);

  const stats = [
    { label: "Collections", value: collections.length, to: "/admin/collections", tone: "c-lilac" },
    { label: "Projects", value: projects.length, to: "/admin/projects", tone: "c-peach" },
    { label: "Upcoming events", value: upcoming.length, to: "/admin/events", tone: "c-sky" },
    { label: "Pending applicants", value: pending, to: "/admin/events", tone: "c-yellow" },
    { label: "Unread messages", value: unread, to: "/admin/messages", tone: "c-lime" },
  ];

  const steps = [
    { done: !!profile?.name, text: "Add your name and bio", to: "/admin/profile" },
    { done: !!profile?.photo?.url, text: "Upload your profile photo", to: "/admin/profile" },
    { done: collections.length > 0, text: "Create your first collection", to: "/admin/collections" },
    { done: projects.length > 0, text: "Add a project with photos", to: "/admin/projects" },
    { done: events.length > 0, text: "Post your first event", to: "/admin/events" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <>
      <section className="dash-hero">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>
            {greet}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="hero-sub">
            {alerts.length ? `You have ${alerts.join(" and ")}.` : "Everything is up to date."}
          </p>
        </div>
        <div className="row-actions">
          <Link to="/admin/collections" className="btn-sm">+ Collection</Link>
          <Link to="/admin/projects" className="btn-sm">+ Project</Link>
          <Link to="/admin/events" className="btn-sm">+ Event</Link>
        </div>
      </section>

      <div className="admin-stats">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className={`admin-stat ${s.tone}`}>
            <span className="stat-go">&rsaquo;</span>
            <strong>{s.value}</strong>
            <span className="stat-label">{s.label}</span>
          </Link>
        ))}
      </div>

      {doneCount < steps.length && (
        <section className="dash-card setup">
          <div className="dash-card-head">
            <h2>Set up your portfolio</h2>
            <span className="badge">{doneCount} / {steps.length}</span>
          </div>
          <div className="progress">
            <i style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <ul className="steps">
            {steps.map((s) => (
              <li key={s.text} className={s.done ? "done" : ""}>
                <Link to={s.to}>
                  <span className="check-dot">{s.done ? "\u2713" : ""}</span>
                  {s.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Upcoming events</h2>
          <Link to="/admin/events" className="pill">Manage</Link>
        </div>
        {upcoming.length === 0 && <p className="muted">No upcoming events.</p>}
        <div className="mini-list">
          {upcoming.slice(0, 4).map((e) => {
            const d = new Date(e.startsAt);
            return (
              <Link key={e._id} to={`/admin/events/${e._id}/applicants`} className="mini-row">
                <div className="date-tile">
                  <strong>{d.getDate()}</strong>
                  <span>{d.toLocaleDateString(undefined, { month: "short" })}</span>
                </div>
                <div>
                  <strong>{e.title}</strong>
                  <p className="meta">
                    {e.state === "live" ? "Happening now" : <CountdownText target={e.startsAt} />}
                  </p>
                </div>
                {e.applicants?.pending > 0 ? (
                  <span className="badge star">{e.applicants.pending} pending</span>
                ) : (
                  <span className="meta">{e.seatsTaken} seats</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="dash-grid">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Recent projects</h2>
            <Link to="/admin/projects" className="pill">See all</Link>
          </div>
          {projects.length === 0 && <p className="muted">No projects yet.</p>}
          <div className="mini-list">
            {projects.slice(0, 4).map((p) => (
              <Link key={p._id} to="/admin/projects" className="mini-row">
                <div className="mini-thumb">
                  {p.images?.[0] && <img src={p.images[0].url} alt={p.title} />}
                </div>
                <div>
                  <strong>{p.title}</strong>
                  <p className="meta">{p.collectionId?.title || "No collection"}</p>
                </div>
                {!p.isPublished && <span className="badge draft">Hidden</span>}
                {p.featured && <span className="badge star">Featured</span>}
              </Link>
            ))}
          </div>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Latest messages</h2>
            <Link to="/admin/messages" className="pill">Inbox</Link>
          </div>
          {messages.length === 0 && <p className="muted">No messages yet.</p>}
          <div className="mini-list">
            {messages.slice(0, 4).map((m) => (
              <Link key={m._id} to="/admin/messages" className="mini-row">
                <div className="avatar-sm">{m.name.charAt(0).toUpperCase()}</div>
                <div>
                  <strong>
                    {!m.read && <i className="dot" />}
                    {m.name}
                  </strong>
                  <p className="meta mini-clip">{m.subject || m.message}</p>
                </div>
                <span className="meta">{new Date(m.createdAt).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}