import { useEffect } from "react";

export default function Lightbox({ images, index, onClose, onChange }) {
  const prev = () => onChange((index - 1 + images.length) % images.length);
  const next = () => onChange((index + 1) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  const img = images[index];

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Close">×</button>
      {images.length > 1 && (
        <>
          <button
            className="lb-arrow lb-prev"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="lb-arrow lb-next"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}
      <img src={img.url} alt={img.alt || ""} onClick={(e) => e.stopPropagation()} />
      <span className="lb-count">{index + 1} / {images.length}</span>
    </div>
  );
}