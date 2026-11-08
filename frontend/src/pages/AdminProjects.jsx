import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import ImageUploader from "../components/ImageUploader";

const blank = (collectionId = "") => ({
  title: "",
  collectionId,
  year: "",
  order: 0,
  materials: "",
  description: "",
  tags: "",
  featured: false,
  isPublished: true,
  images: [],
});

export default function AdminProjects() {
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      Promise.all([
        api.get("/projects/admin/all"),
        api.get("/collections/admin/all"),
      ])
        .then(([p, c]) => {
          setItems(p.data);
          setCollections(c.data);
        })
        .catch(() => setError("Could not load projects"))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const startNew = () => {
    if (collections.length === 0) {
      setError("Create a collection first, then add projects to it.");
      return;
    }
    setEditing(null);
    setForm(blank(collections[0]._id));
    setError("");
  };

  const startEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title,
      collectionId: p.collectionId?._id || "",
      year: p.year ?? "",
      order: p.order ?? 0,
      materials: p.materials || "",
      description: p.description || "",
      tags: (p.tags || []).join(", "),
      featured: p.featured,
      isPublished: p.isPublished,
      images: p.images || [],
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => {
    setForm(null);
    setEditing(null);
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.collectionId) {
      setError("Choose a collection");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      collectionId: form.collectionId,
      description: form.description,
      materials: form.materials,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      featured: form.featured,
      isPublished: form.isPublished,
      order: Number(form.order) || 0,
      images: form.images.map(({ url, publicId, alt }) => ({
        url,
        publicId,
        alt: alt || "",
      })),
      ...(form.year !== "" && { year: Number(form.year) }),
    };

    try {
      if (editing) await api.put(`/projects/${editing._id}`, payload);
      else await api.post("/projects", payload);

      const removed = (editing?.images || []).filter(
        (o) => !form.images.some((i) => i.publicId === o.publicId)
      );
      await Promise.allSettled(
        removed.map((r) => api.delete("/uploads", { data: { publicId: r.publicId } }))
      );

      setForm(null);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const patch = async (p, changes) => {
    setError("");
    try {
      await api.put(`/projects/${p._id}`, changes);
      await load();
    } catch {
      setError("Could not update");
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}" and its photos?`)) return;
    setError("");
    try {
      await api.delete(`/projects/${p._id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete");
    }
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">Manage</p>
          <h1>Projects</h1>
        </div>
        {!form && <button className="btn" onClick={startNew}>New project</button>}
      </div>

      {form && (
        <form onSubmit={save} className="form admin-form">
          <label className="field full">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Silk Evening Gown"
              required
            />
          </label>
          <label className="field">
            <span>Collection</span>
            <select
              value={form.collectionId}
              onChange={(e) => set("collectionId", e.target.value)}
              required
            >
              {collections.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Year</span>
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="2026"
            />
          </label>
          <label className="field full">
            <span>Description</span>
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Materials</span>
            <input
              value={form.materials}
              onChange={(e) => set("materials", e.target.value)}
              placeholder="Silk, organza"
            />
          </label>
          <label className="field">
            <span>Tags (separate with commas)</span>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="evening wear, silk"
            />
          </label>
          <label className="field">
            <span>Display order (lower shows first)</span>
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", e.target.value)}
            />
          </label>
          <div className="field">
            <span>Options</span>
            <label className="check">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Featured on the home page
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => set("isPublished", e.target.checked)}
              />
              Visible on the website
            </label>
          </div>
          <div className="field full">
            <span>Photos (the first one is the cover)</span>
            <ImageUploader
              images={form.images}
              onChange={(arr) => set("images", arr)}
              multiple
              withAlt
            />
          </div>

          {error && <p className="form-error full">{error}</p>}
          <div className="form-actions full">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create project"}
            </button>
            <button type="button" className="btn" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      {error && !form && <p className="form-error">{error}</p>}
      {loading && <p className="loading">Loading</p>}
      {!loading && items.length === 0 && <p className="muted">No projects yet.</p>}

      <div className="admin-list">
        {items.map((p) => (
          <div key={p._id} className="admin-row">
            <div className="thumb">
              {p.images?.[0] && <img src={p.images[0].url} alt={p.title} />}
            </div>
            <div>
              <h3>
                {p.title}
                {p.featured && <span className="badge star">Featured</span>}
                {!p.isPublished && <span className="badge draft">Hidden</span>}
              </h3>
              <p className="meta">
                {p.collectionId?.title || "No collection"}
                {p.year ? ` / ${p.year}` : ""} / {p.images?.length || 0} photos
              </p>
            </div>
            <div className="row-actions">
              <button className="btn-sm" onClick={() => startEdit(p)}>Edit</button>
              <button className="btn-sm" onClick={() => patch(p, { featured: !p.featured })}>
                {p.featured ? "Unfeature" : "Feature"}
              </button>
              <button className="btn-sm" onClick={() => patch(p, { isPublished: !p.isPublished })}>
                {p.isPublished ? "Hide" : "Show"}
              </button>
              <button className="btn-sm danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}