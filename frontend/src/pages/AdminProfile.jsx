import { useEffect, useState } from "react";
import api from "../api/client";
import ImageUploader from "../components/ImageUploader";

const emptyPhoto = { url: "", publicId: "" };

export default function AdminProfile() {
  const [form, setForm] = useState(null);
  const [originalPhoto, setOriginalPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .get("/profile")
      .then((res) => {
        const p = res.data;
        setOriginalPhoto(p.photo?.publicId || "");
        setForm({
          name: p.name || "",
          tagline: p.tagline || "",
          role: p.role || "",
          bio: p.bio || "",
          email: p.email || "",
          location: p.location || "",
          photo: p.photo?.url ? p.photo : emptyPhoto,
          social: {
            instagram: p.social?.instagram || "",
            pinterest: p.social?.pinterest || "",
            behance: p.social?.behance || "",
            linkedin: p.social?.linkedin || "",
          },
        });
      })
      .catch(() => setStatus("Could not load the profile"));
  }, []);

  if (!form) return <p className="loading">{status || "Loading"}</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSocial = (key, value) =>
    setForm((f) => ({ ...f, social: { ...f.social, [key]: value } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await api.put("/profile", form);
      if (originalPhoto && originalPhoto !== form.photo.publicId) {
        api.delete("/uploads", { data: { publicId: originalPhoto } }).catch(() => {});
      }
      setOriginalPhoto(form.photo.publicId);
      setStatus("Saved. Your About page is updated.");
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">Manage</p>
          <h1>Profile</h1>
        </div>
      </div>

      <form onSubmit={save} className="form admin-form">
        <label className="field">
          <span>Name</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="field">
          <span>Tagline</span>
          <input
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Fashion Designer based in Tunis"
          />
        </label>
        <label className="field">
          <span>Public email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Location</span>
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </label>
        <label className="field full">
          <span>Role (shown above your name on the home page)</span>
          <input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Fashion designer and event host" />
        </label>
        <label className="field full">
          <span>Bio</span>
          <textarea
            rows="8"
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </label>

        {Object.keys(form.social).map((key) => (
          <label key={key} className="field">
            <span>{key} link</span>
            <input
              value={form.social[key]}
              onChange={(e) => setSocial(key, e.target.value)}
              placeholder="https://"
            />
          </label>
        ))}

        <div className="field full">
          <span>Photo (a PNG with a transparent background looks best on the home page)</span>
          <ImageUploader
            images={form.photo.url ? [form.photo] : []}
            onChange={(arr) =>
              set(
                "photo",
                arr[0] ? { url: arr[0].url, publicId: arr[0].publicId } : emptyPhoto
              )
            }
          />
        </div>

        {status && <p className="meta full">{status}</p>}
        <div className="form-actions full">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </>
  );
}