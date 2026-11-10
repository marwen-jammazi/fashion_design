import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import Countdown from "../components/Countdown";
import ShareButtons from "../components/ShareButtons";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { eventLabel, formatDateTime } from "../utils/time";
import { downloadIcs, googleCalendarUrl } from "../utils/calendar";

const emptyForm = { name: "", email: "", phone: "", guests: 1, note: "", website: "" };

export default function EventDetail() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState("");

  useDocumentTitle(event?.title);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/events/${slug}`)
      .then((res) => {
        if (!cancelled) setEvent(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Event not found");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) return <p className="muted">{error}</p>;
  if (!event) return <p className="loading">Loading</p>;

  const label = eventLabel(event);
  const maxGuests = Math.min(5, event.spotsLeft ?? 5);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post(`/events/${slug}/register`, {
        ...form,
        guests: Number(form.guests),
        answers,
      });
      setStatus("sent");
      setForm(emptyForm);
      setAnswers({});
    } catch (err) {
      setStatus(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <article>
      <Link to="/events" className="eyebrow back">&larr; All events</Link>
      <p className="eyebrow">{event.category}</p>
      <h1 className="page-title">{event.title}</h1>
      <span className={label.tone ? `badge ${label.tone}` : "badge"} style={{ marginLeft: 0 }}>
        {label.text}
      </span>

      <div className="event-layout">
        <div>
          {event.coverImage?.url && (
            <div className="event-cover">
              <img src={event.coverImage.url} alt={event.title} />
            </div>
          )}

          {event.state === "upcoming" && (
            <div className="countdown-wrap">
              <p className="eyebrow">Starts in</p>
              <Countdown target={event.startsAt} />
            </div>
          )}
          {event.state === "live" && <p className="lead">This event is happening right now.</p>}
          {event.state === "ended" && <p className="lead">This event has ended.</p>}

          {event.description && <p className="bio">{event.description}</p>}

          <dl>
            <dt>When</dt>
            <dd>{formatDateTime(event.startsAt)}</dd>
            {event.endsAt && (<><dt>Ends</dt><dd>{formatDateTime(event.endsAt)}</dd></>)}
            {event.location && (<><dt>Where</dt><dd>{event.location}</dd></>)}
            {event.price && (<><dt>Price</dt><dd>{event.price}</dd></>)}
            {event.spotsLeft !== null && (<><dt>Spots left</dt><dd>{event.spotsLeft}</dd></>)}
            {event.registrationDeadline && event.state === "upcoming" && (
              <><dt>Apply until</dt><dd>{formatDateTime(event.registrationDeadline)}</dd></>
            )}
          </dl>

          <div className="event-actions">
            {event.state !== "ended" && (
              <div>
                <p className="eyebrow">Add to calendar</p>
                <div className="row-actions left">
                  <a
                    className="btn-sm"
                    href={googleCalendarUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Calendar
                  </a>
                  <button type="button" className="btn-sm" onClick={() => downloadIcs(event)}>
                    Apple / Outlook
                  </button>
                </div>
              </div>
            )}
            <div>
              <p className="eyebrow">Share this event</p>
              <ShareButtons title={event.title} />
            </div>
          </div>
        </div>

        <aside>
          {event.registrationsOpen ? (
            status === "sent" ? (
              <div className="apply-card">
                <h2>You are on the list</h2>
                <p className="lead">
                  Your application was received. You will be contacted by email if anything changes.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="form apply-card">
                <h2>Apply to join</h2>
                <input name="name" placeholder="Full name" value={form.name} onChange={onChange} required />
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
                <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={onChange} />

                {event.questions?.map((q) => (
                  <label key={q._id} className="field">
                    <span>
                      {q.label}
                      {q.required ? " *" : ""}
                    </span>
                    {q.type === "textarea" ? (
                      <textarea
                        rows="3"
                        required={q.required}
                        value={answers[q._id] || ""}
                        onChange={(e) => setAnswer(q._id, e.target.value)}
                      />
                    ) : q.type === "select" ? (
                      <select
                        required={q.required}
                        value={answers[q._id] || ""}
                        onChange={(e) => setAnswer(q._id, e.target.value)}
                      >
                        <option value="">Choose...</option>
                        {q.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={q.required}
                        value={answers[q._id] || ""}
                        onChange={(e) => setAnswer(q._id, e.target.value)}
                      />
                    )}
                  </label>
                ))}

                <label className="field">
                  <span>Number of people (including you)</span>
                  <select name="guests" value={form.guests} onChange={onChange}>
                    {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <textarea name="note" placeholder="Anything we should know? (optional)" rows="3" value={form.note} onChange={onChange} />

                {/* honeypot: hidden from humans, bots fill it */}
                <input
                  name="website"
                  value={form.website}
                  onChange={onChange}
                  tabIndex="-1"
                  autoComplete="off"
                  style={{ display: "none" }}
                />

                <button type="submit" className="btn" disabled={status === "sending"}>
                  {status === "sending" ? "Sending..." : "Send application"}
                </button>
                {status && status !== "sending" && status !== "sent" && (
                  <p className="form-error">{status}</p>
                )}
              </form>
            )
          ) : (
            <div className="apply-card">
              <h2>{label.text}</h2>
              <p className="meta">
                {event.state === "ended"
                  ? "This event has ended."
                  : event.spotsLeft === 0
                  ? "All spots are taken."
                  : event.registrationOpen
                  ? "The application deadline has passed."
                  : "Applications were closed by the organizer."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}