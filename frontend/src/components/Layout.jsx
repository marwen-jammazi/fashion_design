import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import api from "../api/client";

export default function Layout() {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api.get("/profile").then((res) => setProfile(res.data)).catch(() => {});
  }, []);

  // only scrolls, no setState, so the linter is happy
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
        © {new Date().getFullYear()} {profile?.name}
      </footer>
    </>
  );
}