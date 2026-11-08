import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";

export default function CollectionDetail() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/collections/${slug}`)
      .then((res) => setCollection(res.data))
      .catch(() => setError("Collection not found"));
  }, [slug]);

  if (error) return <p className="muted">{error}</p>;
  if (!collection) return <p className="loading">Loading</p>;

  return (
    <section>
      <p className="eyebrow">
        {[collection.season, collection.year].filter(Boolean).join(" · ")}
      </p>
      <h1 className="page-title">{collection.title}</h1>
      {collection.description && <p className="lead">{collection.description}</p>}

      {collection.projects.length === 0 && <p className="muted">No projects in this collection yet.</p>}
      <div className="grid">
        {collection.projects.map((p) => (
          <Link key={p._id} to={`/projects/${p.slug}`} className="card">
            <div className="card-img">
              {p.images[0] && (
                <img src={p.images[0].url} alt={p.images[0].alt || p.title} loading="lazy" />
              )}
            </div>
            <h3>{p.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}