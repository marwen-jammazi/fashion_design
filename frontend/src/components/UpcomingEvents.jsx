import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import EventCard from "./EventCard";

// small teaser for the home page; renders nothing when there are no events
export default function UpcomingEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api
      .get("/events")
      .then((res) => setEvents(Array.isArray(res.data) ? res.data.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="events-teaser">
      <div className="panel-head">
        <h2 className="teaser-title">Upcoming events</h2>
        <Link to="/events" className="pill">All events</Link>
      </div>
      <div className="grid event-grid">
        {events.map((e) => (
          <EventCard key={e._id} event={e} />
        ))}
      </div>
    </section>
  );
}