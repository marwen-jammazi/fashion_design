import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import ImageUploader from "../components/ImageUploader";

const emptyImage = { url: "", publicId: "" };
const emptyForm = {
  title: "",
  season: "",
  year: "",
  description: "",
  order: 0,
  isPublished: true,
  coverImage: emptyImage,
};

export default function AdminCollections() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      api
        .get("/collections/admin/all")
        .then((res) => setItems(res.data))
        .catch(() => setError("Could not load collections"))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const startNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
  };

  const startEdit = (c) => {
    setEditing(c);
    setForm({
      title: c.title,
      season: c.season || "",
      year: c.year ?? "",
      description: c.description || "",
      order: c.order ?? 0,
      isPublished: c.isPublished,
      coverImage: c.coverImage?.url ? c.coverImage : emptyImage,
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
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      season: form.season,
      description: form.description,
      order: Number(form.order) || 0,
      isPublished: form.isPublished,
      coverImage: form.coverImage,
      ...(form.year !== "" && { year: Number(form.year) }),
    };

    try {
      if (editing) await api.put(`/collections/${editing._id}`, payload);
      else await api.post("/collections", payload);

      const old = editing?.coverImage?.publicId;
      if (old && old !== form.coverImage.publicId) {
        api.delete("/uploads", { data: { publicId: old } }).catch(() => {});
      }

      setForm(null);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    setError("");
    try {
      await api.delete(`/collections/${c._id}`);
      if (c.coverImage?.publicId) {
        api
          .delete("/uploads", { data: { publicId: c.coverImage.publicId } })
          .catch(() => {});
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete");
    }
  };

  const toggle = async (c) => {
    setError("");
    try {
      await api.put(`/collections/${c._id}`, { isPublished: !c.isPublished });
      await load();
    } catch {
      setError("Could not update");
    }
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">Manage</p>
          <h1>Collections</h1>
        </div>
        {!form && (
          <button className="btn" onClick={startNew}>New collection</button>
        )}
      </div>

      {form && (
        <form onSubmit={save} className="form admin-form">
          <label className="field full">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="SS26 Runway"
              required
            />
          </label>
          <label className="field">
            <span>Season</span>
            <input
              value={form.season}
              onChange={(e) => set("season", e.target.value)}
              placeholder="Spring/Summer"
            />
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
            <span>Display order (lower shows first)</span>
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", e.target.value)}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
            />
            Visible on the website
          </label>
          <div className="field full">
            <span>Cover photo</span>
            <ImageUploader
              images={form.coverImage.url ? [form.coverImage] : []}
              onChange={(arr) =>
                set(
                  "coverImage",
                  arr[0] ? { url: arr[0].url, publicId: arr[0].publicId } : emptyImage
                )
              }
            />
          </div>

          {error && <p className="form-error full">{error}</p>}
          <div className="form-actions full">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create collection"}
            </button>
            <button type="button" className="btn" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      {error && !form && <p className="form-error">{error}</p>}
      {loading && <p className="loading">Loading</p>}
      {!loading && items.length === 0 && <p className="muted">No collections yet.</p>}

      <div className="admin-list">
        {items.map((c) => (
          <div key={c._id} className="admin-row">
            <div className="thumb">
              {c.coverImage?.url && <img src={c.coverImage.url} alt={c.title} />}
            </div>
            <div>
              <h3>
                {c.title}
                <span className={c.isPublished ? "badge" : "badge draft"}>
                  {c.isPublished ? "Live" : "Hidden"}
                </span>
              </h3>
              <p className="meta">
                {[c.season, c.year].filter(Boolean).join(" ")} &middot; order {c.order}
              </p>
            </div>
            <div className="row-actions">
              <button className="btn-sm" onClick={() => startEdit(c)}>Edit</button>
              <button className="btn-sm" onClick={() => toggle(c)}>
                {c.isPublished ? "Hide" : "Show"}
              </button>
              <button className="btn-sm danger" onClick={() => remove(c)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}