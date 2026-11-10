import { useState } from "react";

// draws the image on a tiny canvas and checks the four corners:
// transparent corners mean a cutout PNG, anything else is a regular photo
const hasTransparentCorners = (img) => {
  try {
    const s = 24;
    const canvas = document.createElement("canvas");
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, s, s);
    return [[0, 0], [s - 1, 0], [0, s - 1], [s - 1, s - 1]].every(
      ([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] < 20
    );
  } catch {
    return false; // image could not be read: treat it as a regular photo
  }
};

export default function HeroPhoto({ src, alt }) {
  const [cutout, setCutout] = useState(false);
  const [cors, setCors] = useState(true);

  return (
    <div className={cutout ? "hero-figure cutout" : "hero-figure framed"}>
      <img
        src={src}
        alt={alt}
        crossOrigin={cors ? "anonymous" : undefined}
        onLoad={(e) => setCutout(hasTransparentCorners(e.currentTarget))}
        onError={() => {
          // if the image host blocks cross-origin reads, load it normally
          if (cors) setCors(false);
        }}
      />
    </div>
  );
}