import { Link } from "react-router-dom";
import { CountdownText } from "./Countdown";
import { eventLabel, formatDateTime } from "../utils/time";

export default function EventCard({ event: e }) {
  const label = eventLabel(e);

  return (
    <Link to={`/events/${e.slug}`} className="card event-card">
      <div className="card-img">
        {e.coverImage?.url && (
          <img src={e.coverImage.url} alt={e.title} loading="lazy" />
        )}
      </div>
      {e.category && <p className="eyebrow card-cat">{e.category}</p>}
      <h3>{e.title}</h3>
      <p className="meta">{formatDateTime(e.startsAt)}</p>
      {e.location && <p className="meta">{e.location}</p>}
      <div className="event-foot">
        <span className={label.tone ? `badge ${label.tone}` : "badge"}>
          {label.text}
        </span>
        {e.state === "upcoming" && (
          <span className="meta">
            <CountdownText target={e.startsAt} />
          </span>
        )}
      </div>
    </Link>
  );
}