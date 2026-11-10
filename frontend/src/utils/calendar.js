// 2026-11-20T19:00:00.000Z -> 20261120T190000Z
const stamp = (d) =>
  new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const eventUrl = (e) => `${window.location.origin}/events/${e.slug}`;

export const googleCalendarUrl = (e) => {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.startsAt)}/${stamp(e.endTime || e.startsAt)}`,
    details: [e.description, eventUrl(e)].filter(Boolean).join("\n\n"),
    location: e.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const esc = (s) =>
  String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// .ics file: opens in Apple Calendar, Outlook and most other calendar apps
export const downloadIcs = (e) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Portfolio//Events//EN",
    "BEGIN:VEVENT",
    `UID:${e._id}@portfolio`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.startsAt)}`,
    `DTEND:${stamp(e.endTime || e.startsAt)}`,
    `SUMMARY:${esc(e.title)}`,
    e.location ? `LOCATION:${esc(e.location)}` : "",
    `DESCRIPTION:${esc([e.description, eventUrl(e)].filter(Boolean).join("\n\n"))}`,
    `URL:${eventUrl(e)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.slug || "event"}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};