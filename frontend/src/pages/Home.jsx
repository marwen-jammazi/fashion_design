import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import heroImg from "../assets/hero.png";

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [collections, setCollections] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/projects"), api.get("/collections"), api.get("/profile")])
      .then(([p, c, pr]) => {
        setProjects(p.data);
        setCollections(c.data);
        setProfile(pr.data);
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
    { value: projects.length, label: "Looks", color: "#f06fa8" },
    { value: featured.length, label: "Featured", color: "#4fd08a" },
  ];

  return (
    <>
      <div className="bento">
        {/* Hero */}
        <section className="hero-card glass">
          <div className="hero-text">
            <p className="tiny">Fashion Designer</p>
            <h1>{profile?.name || "Welcome"}</h1>
            {profile?.tagline && <p className="hero-sub">{profile.tagline}</p>}
            <Link to="/collections" className="btn">View collections</Link>
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
            <Link to="/collections" className="round-btn" aria-label="Collections">›</Link>
          </div>
        </section>

        {/* Latest collection */}
        <section className="side-card glass">
          <p className="tiny">Latest collection</p>
          {latest ? (
            <Link to={`/collections/${latest.slug}`} className="latest">
              <div>
                <h3>{latest.title}</h3>
                <p className="meta">{[latest.season, latest.year].filter(Boolean).join(" · ")}</p>
              </div>
              {latest.coverImage?.url && (
                <img src={latest.coverImage.url} alt={latest.title} />
              )}
            </Link>
          ) : (
            <p className="muted">No collections yet.</p>
          )}
        </section>

        {/* Featured piece */}
        <section className="side-card glass">
          <p className="tiny">Featured piece</p>
          {spotlight ? (
            <Link to={`/projects/${spotlight.slug}`} className="spotlight">
              <div>
                <h3 className="lime">{spotlight.title}</h3>
                <p className="meta">{spotlight.collectionId?.title}</p>
                <span className="link-arrow">View piece →</span>
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

      {/* Selected work */}
      <section className="panel glass">
        <div className="panel-head">
          <h2>Selected work</h2>
          <Link to="/collections" className="pill">All collections</Link>
        </div>

        <div className="row row-head">
          <span>Look</span><span></span><span>Collection</span><span>Year</span><span></span>
        </div>

        {list.length === 0 && <p className="muted">No projects yet.</p>}
        {list.map((p) => (
          <Link key={p._id} to={`/projects/${p.slug}`} className="row row-item">
            <div className="thumb">
              {p.images[0] && <img src={p.images[0].url} alt={p.title} loading="lazy" />}
            </div>
            <strong>{p.title}</strong>
            <span>{p.collectionId?.title}</span>
            <span>{p.year}</span>
            <span className="arrow">→</span>
          </Link>
        ))}
      </section>
    </>
  );
}