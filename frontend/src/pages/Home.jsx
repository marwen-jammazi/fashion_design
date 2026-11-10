import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import heroImg from "../assets/hero.png";
import UpcomingEvents from "../components/UpcomingEvents";

const safe = (req, fallback) => req.catch(() => ({ data: fallback }));
const asList = (res) => (Array.isArray(res.data) ? res.data : []);

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [collections, setCollections] = useState([]);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      safe(api.get("/projects"), []),
      safe(api.get("/collections"), []),
      safe(api.get("/events"), []),
      safe(api.get("/profile"), null),
    ])
      .then(([p, c, ev, pr]) => {
        setProjects(asList(p));
        setCollections(asList(c));
        setEvents(asList(ev));
        setProfile(pr.data && typeof pr.data === "object" ? pr.data : null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading</p>;

  const featured = projects.filter((p) => p.featured);
  const list = featured.length ? featured : projects;
  const spotlight = list[0];
  const latest = collections[0];

  const stats = [
    { value: collections.length, label: "Collections", color: "#6c8cf5" },
    { value: projects.length, label: "Projects", color: "#f06fa8" },
    { value: events.length, label: "Upcoming events", color: "#4fd08a" },
  ];

  return (
    <>
      <div className="bento">
        {/* Hero */}
        <section className="hero-card glass">
          <div className="hero-text">
            <p className="tiny">{profile?.role || "Portfolio"}</p>
            <h1>{profile?.name || "Welcome"}</h1>
            {profile?.tagline && <p className="hero-sub">{profile.tagline}</p>}
            <div className="btn-row">
              <Link to="/collections" className="btn">View work</Link>
              <Link to="/events" className="btn ghost">See events</Link>
            </div>
          </div>

          <img
            className="hero-photo"
            src={profile?.photo?.url || heroImg}
            alt={profile?.name || "Hero"}
          />

          <div className="stats">
            {stats.map((s) => (
              <div key={s.label} className="stat">
                <strong>{s.value}</strong>
                <span><i style={{ background: s.color }} />{s.label}</span>
              </div>
            ))}
            <Link to="/collections" className="round-btn" aria-label="View work">&rsaquo;</Link>
          </div>
        </section>

        {/* Latest collection */}
        <section className="side-card glass">
          <p className="tiny">Latest collection</p>
          {latest ? (
            <Link to={`/collections/${latest.slug}`} className="latest">
              <div>
                <h3>{latest.title}</h3>
                <p className="meta">{[latest.season, latest.year].filter(Boolean).join(" - ")}</p>
              </div>
              {latest.coverImage?.url && (
                <img src={latest.coverImage.url} alt={latest.title} />
              )}
            </Link>
          ) : (
            <p className="muted">No collections yet.</p>
          )}
        </section>

        {/* Featured project */}
        <section className="side-card glass">
          <p className="tiny">Featured project</p>
          {spotlight ? (
            <Link to={`/projects/${spotlight.slug}`} className="spotlight">
              <div>
                <h3 className="lime">{spotlight.title}</h3>
                <p className="meta">{spotlight.collectionId?.title}</p>
                <span className="link-arrow">View project &rarr;</span>
              </div>
              {spotlight.images[0] && (
                <div className="tile">
                  <img src={spotlight.images[0].url} alt={spotlight.title} />
                </div>
              )}
            </Link>
          ) : (
            <p className="muted">No projects yet.</p>
          )}
        </section>
      </div>

      <UpcomingEvents />

      {/* Selected work */}
      {list.length > 0 && (
        <section className="panel glass">
          <div className="panel-head">
            <h2>Selected work</h2>
            <Link to="/collections" className="pill">All collections</Link>
          </div>

          <div className="row row-head">
            <span>Project</span><span></span><span>Collection</span><span>Year</span><span></span>
          </div>

          {list.map((p) => (
            <Link key={p._id} to={`/projects/${p.slug}`} className="row row-item">
              <div className="thumb">
                {p.images[0] && <img src={p.images[0].url} alt={p.title} loading="lazy" />}
              </div>
              <strong>{p.title}</strong>
              <span>{p.collectionId?.title}</span>
              <span>{p.year}</span>
              <span className="arrow">&rarr;</span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}