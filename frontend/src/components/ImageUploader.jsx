import { useRef, useState } from "react";
import api from "../api/client";

export default function ImageUploader({
  images,
  onChange,
  multiple = false,
  withAlt = false,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    if (files.length > 10) {
      setError("Choose 10 photos at most at once");
      return;
    }

    const data = new FormData();
    files.forEach((f) => data.append("images", f));

    setBusy(true);
    setError("");
    try {
      const res = await api.post("/uploads", data);
      const uploaded = res.data.map((r) => ({
        url: r.url,
        publicId: r.publicId,
        alt: "",
      }));
      onChange(multiple ? [...images, ...uploaded] : [uploaded[0]]);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const copy = [...images];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  const setAlt = (i, alt) =>
    onChange(images.map((img, idx) => (idx === i ? { ...img, alt } : img)));

  return (
    <div className="uploader">
      {images.length > 0 && (
        <div className="upload-grid">
          {images.map((img, i) => (
            <div key={img.publicId || i} className="upload-item">
              <img src={img.url} alt={img.alt || ""} />
              {withAlt && (
                <input
                  placeholder="Describe the photo"
                  value={img.alt || ""}
                  onChange={(e) => setAlt(i, e.target.value)}
                />
              )}
              <div className="tools">
                {multiple && (
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                  >
                    &lsaquo;
                  </button>
                )}
                {multiple && (
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move later"
                  >
                    &rsaquo;
                  </button>
                )}
                <button
                  type="button"
                  className="tool-btn danger"
                  onClick={() => remove(i)}
                  aria-label="Remove"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        hidden
        onChange={onPick}
      />
      <div>
        <button
          type="button"
          className="btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy
            ? "Uploading..."
            : multiple
            ? "+ Add photos"
            : images.length
            ? "Replace photo"
            : "+ Choose photo"}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}