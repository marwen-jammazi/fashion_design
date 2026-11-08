import { useState } from "react";
import api from "../api/client";

const empty = { name: "", email: "", subject: "", message: "", website: "" };

export default function Contact() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post("/messages", form);
      setStatus("sent");
      setForm(empty);
    } catch (err) {
      setStatus(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <section>
      <h1 className="page-title">Contact</h1>
      <p className="lead">Have a project or collaboration in mind? Send a message.</p>

      <form onSubmit={onSubmit} className="form">
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="subject" placeholder="Subject" value={form.subject} onChange={onChange} />
        <textarea name="message" placeholder="Message" rows="6" value={form.message} onChange={onChange} required />

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
          {status === "sending" ? "Sending..." : "Send message"}
        </button>

        {status === "sent" && <p className="meta">Thank you, your message was sent.</p>}
        {status && status !== "sent" && status !== "sending" && <p className="meta">{status}</p>}
      </form>
    </section>
  );
}