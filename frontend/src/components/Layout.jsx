import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import api from "../api/client";
import useAuth from "../context/useAuth";

const titles = {
  "/collections": "Collections",
  "/events": "Events",
  "/about": "About",
  "/contact": "Contact",
  "/admin/login": "Admin login",
};

export default function Layout() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api.get("/profile").then((res) => setProfile(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // browser tab titles for the fixed pages (detail pages set their own)
  useEffect(() => {
    const name = profile?.name;
    if (location.pathname === "/") {
      document.title = name
        ? `${name}${profile.role ? " - " + profile.role : ""}`
        : "Portfolio";
    } else if (titles[location.pathname]) {
      document.title = name
        ? `${titles[location.pathname]} | ${name}`
        : titles[location.pathname];
    }
  }, [location.pathname, profile]);

  const name = profile?.name || "Portfolio";
  const close = () => setOpen(false);

  return (
    <>
      <header className="header">
        <Link to="/" className="logo" onClick={close}>{name}</Link>

        <button className="menu-btn glass" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>

        <div className={open ? "nav-wrap open" : "nav-wrap"}>
          <nav className="nav">
            <NavLink to="/collections" onClick={close}>Collections</NavLink>
            <NavLink to="/events" onClick={close}>Events</NavLink>
            <NavLink to="/about" onClick={close}>About</NavLink>
            <NavLink to="/contact" onClick={close}>Contact</NavLink>
          </nav>

          {/* only the logged-in admin ever sees this */}
          {token && (
            <Link to="/admin" className="pill dash-btn" onClick={close}>
              Dashboard
            </Link>
          )}

          <Link to="/about" className="avatar" aria-label="About" onClick={close}>
            {profile?.photo?.url ? (
              <img src={profile.photo.url} alt={name} />
            ) : (
              <span>{name.charAt(0)}</span>
            )}
          </Link>
        </div>
      </header>

      <main key={location.pathname} className="main page">
        <Outlet />
      </main>

      <footer className="footer">
        &copy; {new Date().getFullYear()} {profile?.name}
        {token && (
          <Link to="/admin" className="footer-link">Dashboard</Link>
        )}
      </footer>
    </>
  );
}