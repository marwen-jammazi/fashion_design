import { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminMessages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/messages")
      .then((res) => setItems(res.data))
      .catch(() => setError("Could not load messages"))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = items.filter((m) => !m.read).length;
  const shown = tab === "unread" ? items.filter((m) => !m.read) : items;

  const markRead = async (m) => {
    try {
      const res = await api.patch(`/messages/${m._id}/read`);
      setItems((list) => list.map((x) => (x._id === m._id ? res.data : x)));
    } catch {
      setError("Could not update message");
    }
  };

  const toggleOpen = (m) => {
    setOpenId(openId === m._id ? null : m._id);
    if (!m.read) markRead(m);
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await api.delete(`/messages/${m._id}`);
      setItems((list) => list.filter((x) => x._id !== m._id));
    } catch {
      setError("Could not delete message");
    }
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Messages</h1>
        </div>
      </div>

      <div className="msg-tabs">
        <button
          className={tab === "all" ? "btn-sm active" : "btn-sm"}
          onClick={() => setTab("all")}
        >
          All ({items.length})
        </button>
        <button
          className={tab === "unread" ? "btn-sm active" : "btn-sm"}
          onClick={() => setTab("unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p className="loading">Loading</p>}
      {!loading && shown.length === 0 && <p className="muted">Nothing here.</p>}

      <div className="admin-list">
        {shown.map((m) => (
          <div
            key={m._id}
            className={m.read ? "msg" : "msg unread"}
            onClick={() => toggleOpen(m)}
          >
            <div className="msg-head">
              <strong>
                {!m.read && <i className="dot" />}
                {m.name}
              </strong>
              <span className="meta">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <p className="meta">
              {m.email}
              {m.subject ? ` / ${m.subject}` : ""}
            </p>

            {openId === m._id ? (
              <>
                <p className="msg-body">{m.message}</p>
                <div className="row-actions msg-actions" onClick={(e) => e.stopPropagation()}>
                  <a
                    className="btn-sm"
                    href={`mailto:${m.email}?subject=${encodeURIComponent(
                      "Re: " + (m.subject || "Your message")
                    )}`}
                  >
                    Reply by email
                  </a>
                  {!m.read && (
                    <button className="btn-sm" onClick={() => markRead(m)}>
                      Mark as read
                    </button>
                  )}
                  <button className="btn-sm danger" onClick={() => remove(m)}>
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <p className="msg-preview">{m.message}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}