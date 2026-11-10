import { useState } from "react";

export default function ShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false);
  const link = url || window.location.href;
  const text = `${title} - ${link}`;
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", link);
    }
  };

  const nativeShare = () => navigator.share({ title, url: link }).catch(() => {});

  return (
    <div className="row-actions left">
      <a
        className="btn-sm"
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp
      </a>
      <a
        className="btn-sm"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
        target="_blank"
        rel="noreferrer"
      >
        Facebook
      </a>
      <button type="button" className="btn-sm" onClick={copy}>
        {copied ? "Copied!" : "Copy link"}
      </button>
      {canNativeShare && (
        <button type="button" className="btn-sm" onClick={nativeShare}>
          More...
        </button>
      )}
    </div>
  );
}