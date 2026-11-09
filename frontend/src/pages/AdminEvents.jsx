import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import ImageUploader from "../components/ImageUploader";
import {
  eventLabel,
  formatDateTime,
  fromLocalInput,
  toLocalInput,
} from "../utils/time";

const emptyImage = { url: "", publicId: "" };
const emptyForm = {
  title: "",
  category: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  registrationDeadline: "",
  capacity: 0,
  price: "Free",
  registrationOpen: true,
  isPublished: true,
  coverImage: emptyImage,
};

export default function AdminEvents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      api
        .get("/events/admin/all")
        .then((res) => setItems(res.data))
        .catch(() => setError("Could not load events"))
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

  const startEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      category: ev.category || "",
      description: ev.description || "",
      location: ev.location || "",
      startsAt: toLocalInput(ev.startsAt),
      endsAt: toLocalInput(ev.endsAt),
      registrationDeadline: toLocalInput(ev.registrationDeadline),
      capacity: ev.capacity ?? 0,
      price: ev.price || "",
      registrationOpen: ev.registrationOpen,
      isPublished: ev.isPublished,
      coverImage: ev.coverImage?.url ? ev.coverImage : emptyImage,
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
    setError("");

    const startsAt = fromLocalInput(form.startsAt);
    const endsAt = fromLocalInput(form.endsAt);
    const deadline = fromLocalInput(form.registrationDeadline);

    if (!startsAt) return setError("Choose a start date and time");
    if (endsAt && new Date(endsAt) <= new Date(startsAt))
      return setError("The end time must be after the start time");
    if (deadline && new Date(deadline) > new Date(startsAt))
      return setError("The application deadline must be before the event starts");

    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      location: form.location,
      startsAt,
      endsAt,
      registrationDeadline: deadline,
      capacity: Number(form.capacity) || 0,
      price: form.price,
      registrationOpen: form.registrationOpen,
      isPublished: form.isPublished,
      coverImage: form.coverImage,
    };

    try {
      if (editing) await api.put(`/events/${editing._id}`, payload);
      else await api.post("/events", payload);

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

  const patch = async (ev, changes) => {
    setError("");
    try {
      await api.put(`/events/${ev._id}`, changes);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update");
    }
  };

  const remove = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}" and all its applications?`)) return;
    setError("");
    try {
      await api.delete(`/events/${ev._id}`);
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
          <h1>Events</h1>
        </div>
        {!form && <button className="btn" onClick={startNew}>New event</button>}
      </div>

      {form && (
        <form onSubmit={save} className="form admin-form">
          <label className="field full">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Karaoke Night"
              required
            />
          </label>
          <label className="field">
            <span>Category</span>
            <input
              list="event-categories"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Karaoke, Basketball..."
            />
            <datalist id="event-categories">
              <option value="Karaoke night" />
              <option value="Basketball" />
              <option value="Fashion show" />
              <option value="Workshop" />
              <option value="Party" />
            </datalist>
          </label>
          <label className="field">
            <span>Location</span>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Venue and city"
            />
          </label>
          <label className="field">
            <span>Starts</span>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Ends (optional, otherwise 3 hours after the start)</span>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Apply before (optional, otherwise the start time)</span>
            <input
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => set("registrationDeadline", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Capacity (0 = unlimited)</span>
            <input
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Price</span>
            <input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="Free, 15 TND..."
            />
          </label>
          <div className="field">
            <span>Options</span>
            <label className="check">
              <input
                type="checkbox"
                checked={form.registrationOpen}
                onChange={(e) => set("registrationOpen", e.target.checked)}
              />
              Accepting applications
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
          <label className="field full">
            <span>Description</span>
            <textarea
              rows="5"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
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
              {saving ? "Saving..." : editing ? "Save changes" : "Create event"}
            </button>
            <button type="button" className="btn" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      {error && !form && <p className="form-error">{error}</p>}
      {loading && <p className="loading">Loading</p>}
      {!loading && items.length === 0 && <p className="muted">No events yet.</p>}

      <div className="admin-list">
        {items.map((ev) => {
          const label = eventLabel(ev);
          return (
            <div key={ev._id} className="admin-row">
              <div className="thumb">
                {ev.coverImage?.url && <img src={ev.coverImage.url} alt={ev.title} />}
              </div>
              <div>
                <h3>
                  {ev.title}
                  <span className={label.tone ? `badge ${label.tone}` : "badge"}>
                    {label.text}
                  </span>
                  {!ev.isPublished && <span className="badge draft">Hidden</span>}
                </h3>
                <p className="meta">
                  {formatDateTime(ev.startsAt)}
                  {ev.location ? ` - ${ev.location}` : ""}
                </p>
                <p className="meta">
                  {ev.applicants.pending} pending, {ev.applicants.approved} approved,{" "}
                  {ev.seatsTaken}
                  {ev.capacity > 0 ? ` / ${ev.capacity}` : ""} seats
                </p>
              </div>
              <div className="row-actions">
                <Link className="btn-sm" to={`/admin/events/${ev._id}/applicants`}>
                  Applicants
                </Link>
                <button className="btn-sm" onClick={() => startEdit(ev)}>Edit</button>
                <button
                  className="btn-sm"
                  onClick={() => patch(ev, { registrationOpen: !ev.registrationOpen })}
                >
                  {ev.registrationOpen ? "Close applications" : "Open applications"}
                </button>
                <button
                  className="btn-sm"
                  onClick={() => patch(ev, { isPublished: !ev.isPublished })}
                >
                  {ev.isPublished ? "Hide" : "Show"}
                </button>
                <button className="btn-sm danger" onClick={() => remove(ev)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}