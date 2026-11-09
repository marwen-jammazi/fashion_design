const pad = (n) => String(n).padStart(2, "0");

// ISO string -> value for <input type="datetime-local"> (local time)
export const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

// datetime-local value -> ISO string (or null when empty)
export const fromLocalInput = (value) =>
  value ? new Date(value).toISOString() : null;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDateTime = (iso) => `${formatDate(iso)} - ${formatTime(iso)}`;

// text + badge style shown on cards and in the admin
export const eventLabel = (e) => {
  if (e.state === "ended") return { text: "Ended", tone: "draft" };
  if (e.state === "live") return { text: "Happening now", tone: "star" };
  if (e.spotsLeft === 0) return { text: "Full", tone: "draft" };
  if (!e.registrationsOpen) return { text: "Applications closed", tone: "draft" };
  if (e.spotsLeft !== null && e.spotsLeft <= 10)
    return { text: `${e.spotsLeft} spots left`, tone: "star" };
  return { text: "Open for applications", tone: "" };
};