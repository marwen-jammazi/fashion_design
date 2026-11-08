import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/collections")
      .then((res) => setCollections(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading</p>;

  return (
    <section>
      <h1 className="page-title">Collections</h1>
      {collections.length === 0 && <p className="muted">No collections yet.</p>}
      <div className="grid">
        {collections.map((c) => (
          <Link key={c._id} to={`/collections/${c.slug}`} className="card">
            <div className="card-img">
              {c.coverImage?.url && <img src={c.coverImage.url} alt={c.title} loading="lazy" />}
            </div>
            <h3>{c.title}</h3>
            <p className="meta">{[c.season, c.year].filter(Boolean).join(" · ")}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}