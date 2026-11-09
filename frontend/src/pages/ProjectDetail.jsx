import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Lightbox from "../components/Lightbox";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  useDocumentTitle(project?.title);

  useEffect(() => {
    api
      .get(`/projects/${slug}`)
      .then((res) => setProject(res.data))
      .catch(() => setError("Project not found"));
  }, [slug]);

  if (error) return <p className="muted">{error}</p>;
  if (!project) return <p className="loading">Loading</p>;

  return (
    <article>
      {project.collectionId && (
        <Link to={`/collections/${project.collectionId.slug}`} className="eyebrow back">
          ← {project.collectionId.title}
        </Link>
      )}
      <h1 className="page-title">{project.title}</h1>

      <div className="details">
        {project.description && <p className="lead">{project.description}</p>}
        <dl>
          {project.year && (<><dt>Year</dt><dd>{project.year}</dd></>)}
          {project.materials && (<><dt>Materials</dt><dd>{project.materials}</dd></>)}
          {project.tags?.length > 0 && (<><dt>Tags</dt><dd>{project.tags.join(", ")}</dd></>)}
        </dl>
      </div>

      <div className="gallery">
        {project.images.map((img, i) => (
          <button key={img.publicId} className="gallery-item" onClick={() => setActive(i)}>
            <img src={img.url} alt={img.alt || project.title} loading="lazy" />
          </button>
        ))}
      </div>

      {active !== null && (
        <Lightbox
          images={project.images}
          index={active}
          onChange={setActive}
          onClose={() => setActive(null)}
        />
      )}
    </article>
  );
}