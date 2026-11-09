import { useEffect } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import useAuth from "../context/useAuth";
import useNoIndex from "../hooks/useNoIndex";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/collections", label: "Collections" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/profile", label: "Profile" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  useNoIndex();

  useEffect(() => {
    document.title = "Admin";
  }, []);

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link to="/admin" className="logo">Studio</Link>

        <nav className="admin-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-side-foot">
          <p className="meta">{admin?.email}</p>
          <Link to="/" className="pill">View site</Link>
          <button className="pill" onClick={logout}>Log out</button>
        </div>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}