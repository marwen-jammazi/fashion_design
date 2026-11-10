import nodemailer from "nodemailer";

// env is read lazily because dotenv runs after the imports are evaluated
let transporter;
const getTransport = () => {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    transporter = null;
    console.log("Email is not configured (SMTP_* missing in .env): notifications are skipped");
    return null;
  }
  const port = Number(SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
};

const send = async ({ to, subject, text, replyTo }) => {
  const t = getTransport();
  if (!t || !to) return;
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      replyTo,
    });
  } catch (err) {
    console.error("Email failed:", err.message);
  }
};

const owner = () => process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
const site = () => process.env.CLIENT_URL || "http://localhost:5173";
const when = (d) =>
  new Date(d).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: process.env.TIMEZONE || "Africa/Tunis",
  });

const eventLines = (event) =>
  [
    `Event: ${event.title}`,
    `When: ${when(event.startsAt)}`,
    event.location ? `Where: ${event.location}` : "",
  ]
    .filter(Boolean)
    .join("\n");

export const notifyNewMessage = (m) =>
  send({
    to: owner(),
    replyTo: m.email,
    subject: `New message from ${m.name}`,
    text: [
      `From: ${m.name} <${m.email}>`,
      m.subject ? `Subject: ${m.subject}` : "",
      "",
      m.message,
      "",
      `Open your inbox: ${site()}/admin/messages`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
  });

export const notifyNewApplication = (event, reg) => {
  send({
    to: owner(),
    replyTo: reg.email,
    subject: `New application: ${event.title}`,
    text: [
      `${reg.name} <${reg.email}> applied to ${event.title}.`,
      reg.phone ? `Phone: ${reg.phone}` : "",
      `People: ${reg.guests}`,
      reg.note ? `Note: ${reg.note}` : "",
      ...(reg.answers || []).map((a) => `${a.question}: ${a.answer}`),
      "",
      `Review applications: ${site()}/admin/events/${event._id}/applicants`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
  });

  return send({
    to: reg.email,
    subject: `We received your application: ${event.title}`,
    text: [
      `Hi ${reg.name},`,
      "",
      "Thank you for applying. Your application was received and is waiting for review.",
      "",
      eventLines(event),
      `People: ${reg.guests}`,
      "",
      `Event page: ${site()}/events/${event.slug}`,
    ].join("\n"),
  });
};

export const notifyApplicationStatus = (event, reg) => {
  const approved = reg.status === "approved";
  return send({
    to: reg.email,
    subject: approved
      ? `You are in: ${event.title}`
      : `About your application: ${event.title}`,
    text: [
      `Hi ${reg.name},`,
      "",
      approved
        ? "Good news, your application was approved. We look forward to seeing you."
        : "Thank you for your interest. Unfortunately we could not confirm your place this time.",
      "",
      eventLines(event),
      approved ? `People: ${reg.guests}` : "",
      "",
      `Event page: ${site()}/events/${event.slug}`,
    ]
      .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
      .join("\n"),
  });
};

export const notifyLockout = (ip) =>
  send({
    to: owner(),
    subject: "Security alert: admin login locked",
    text: [
      "There were several failed login attempts on your admin account.",
      `IP address: ${ip || "unknown"}`,
      "The login is locked for 15 minutes. Nobody got in.",
      "",
      "If this was you, just wait 15 minutes and try again.",
      "If it was not you, no action is needed, but consider changing your password in Settings.",
    ].join("\n"),
  });