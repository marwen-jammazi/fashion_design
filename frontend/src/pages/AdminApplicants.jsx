import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { formatDateTime } from "../utils/time";

const tone = { approved: "badge", pending: "badge star", rejected: "badge draft" };

export default function AdminApplicants() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/events/${id}/registrations`)
      .then((res) => {
        setEvent(res.data.event);
        setItems(res.data.registrations);
      })
      .catch(() => setError("Could not load applicants"))
      .finally(() => setLoading(false));
  }, [id]);

  const count = (s) => items.filter((r) => r.status === s).length;
  const shown = tab === "all" ? items : items.filter((r) => r.status === tab);

  const setStatus = async (r, status) => {
    setError("");
    try {
      const res = await api.patch(`/events/registrations/${r._id}`, { status });
      setItems((list) => list.map((x) => (x._id === r._id ? res.data : x)));
    } catch {
      setError("Could not update the application");
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete the application from ${r.name}?`)) return;
    setError("");
    try {
      await api.delete(`/events/registrations/${r._id}`);
      setItems((list) => list.filter((x) => x._id !== r._id));
    } catch {
      setError("Could not delete the application");
    }
  };

  const exportCsv = () => {
    // one column per question, including questions that were later removed
    const labels = (event?.questions || []).map((q) => q.label);
    items.forEach((r) =>
      (r.answers || []).forEach((a) => {
        if (!labels.includes(a.question)) labels.push(a.question);
      })
    );

    const head = ["Name", "Email", "Phone", "People", "Status", "Note", ...labels, "Applied at"];

    // a leading = + - @ would be run as a formula by Excel, so it is neutralised
    const esc = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = items.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.guests,
      r.status,
      r.note,
      ...labels.map((l) => (r.answers || []).find((a) => a.question === l)?.answer || ""),
      new Date(r.createdAt).toLocaleString(),
    ]);

    const csv =
      "\uFEFF" + [head, ...rows].map((row) => row.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.slug || "event"}-applicants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="loading">Loading</p>;

  return (
    <>
      <div className="admin-top">
        <div>
          <Link to="/admin/events" className="eyebrow back">&larr; Events</Link>
          <h1>{event?.title || "Applicants"}</h1>
          {event && (
            <p className="meta">
              {formatDateTime(event.startsAt)} - {event.seatsTaken}
              {event.capacity > 0 ? ` / ${event.capacity}` : ""} seats taken
            </p>
          )}
        </div>
        <button className="btn-sm" onClick={exportCsv} disabled={items.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="msg-tabs">
        {[
          ["all", `All (${items.length})`],
          ["pending", `Pending (${count("pending")})`],
          ["approved", `Approved (${count("approved")})`],
          ["rejected", `Rejected (${count("rejected")})`],
        ].map(([key, text]) => (
          <button
            key={key}
            className={tab === key ? "btn-sm active" : "btn-sm"}
            onClick={() => setTab(key)}
          >
            {text}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {shown.length === 0 && <p className="muted">No applications here.</p>}

      <div className="admin-list">
        {shown.map((r) => (
          <div key={r._id} className="applicant">
            <div>
              <h3>
                {r.name}
                <span className={tone[r.status]}>{r.status}</span>
              </h3>
              <p className="meta">
                {r.email}
                {r.phone ? ` - ${r.phone}` : ""} - {r.guests} {r.guests > 1 ? "people" : "person"}
              </p>

              {r.answers?.length > 0 && (
                <ul className="answers">
                  {r.answers.map((a) => (
                    <li key={a.question}>
                      <span>{a.question}</span>
                      {a.answer}
                    </li>
                  ))}
                </ul>
              )}

              {r.note && <p className="msg-body">{r.note}</p>}
              <p className="meta">Applied {new Date(r.createdAt).toLocaleString()}</p>
            </div>
            <div className="row-actions">
              {r.status !== "approved" && (
                <button className="btn-sm" onClick={() => setStatus(r, "approved")}>Approve</button>
              )}
              {r.status !== "rejected" && (
                <button className="btn-sm" onClick={() => setStatus(r, "rejected")}>Reject</button>
              )}
              <a
                className="btn-sm"
                href={`mailto:${r.email}?subject=${encodeURIComponent("About " + (event?.title || "the event"))}`}
              >
                Email
              </a>
              <button className="btn-sm danger" onClick={() => remove(r)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}