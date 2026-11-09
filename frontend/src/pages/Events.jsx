import { useEffect, useState } from "react";
import api from "../api/client";
import EventCard from "../components/EventCard";

export default function Events() {
  const [tab, setTab] = useState("upcoming");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/events", { params: { when: tab } })
      .then((res) => {
        if (!cancelled) {
          setEvents(Array.isArray(res.data) ? res.data : []);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const changeTab = (next) => {
    if (next === tab) return;
    setLoading(true);
    setTab(next);
  };

  return (
    <section>
      <p className="eyebrow">What is on</p>
      <h1 className="page-title">Events</h1>

      <div className="msg-tabs">
        <button
          className={tab === "upcoming" ? "btn-sm active" : "btn-sm"}
          onClick={() => changeTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={tab === "past" ? "btn-sm active" : "btn-sm"}
          onClick={() => changeTab("past")}
        >
          Past
        </button>
      </div>

      {error && <p className="muted">Could not load events.</p>}
      {loading && <p className="loading">Loading</p>}
      {!loading && !error && events.length === 0 && (
        <p className="muted">
          {tab === "upcoming" ? "No upcoming events right now. Check back soon." : "No past events yet."}
        </p>
      )}

      <div className="grid">
        {events.map((e) => (
          <EventCard key={e._id} event={e} />
        ))}
      </div>
    </section>
  );
}