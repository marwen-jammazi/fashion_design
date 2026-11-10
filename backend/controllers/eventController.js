import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import cloudinary from "../config/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import pick from "../utils/pick.js";
import { decorate, seatsTakenMap } from "../utils/eventState.js";
import { notifyNewApplication, notifyApplicationStatus } from "../utils/mailer.js";

const FIELDS = [
  "title", "category", "description", "coverImage", "location",
  "startsAt", "endsAt", "registrationDeadline", "capacity",
  "price", "registrationOpen", "isPublished", "questions",
];

const THREE_HOURS = 3 * 60 * 60 * 1000;
const QUESTION_TYPES = ["text", "textarea", "select"];

const cleanQuestions = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, 10)
    .map((q) => {
      const label = String(q?.label || "").trim().slice(0, 120);
      const options = Array.isArray(q?.options)
        ? q.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 20)
        : [];
      let type = QUESTION_TYPES.includes(q?.type) ? q.type : "text";
      if (type === "select" && options.length < 2) type = "text";
      const clean = {
        label,
        type,
        required: !!q?.required,
        options: type === "select" ? options : [],
      };
      if (q?._id) clean._id = q._id;
      return clean;
    })
    .filter((q) => q.label);
};

const checkDates = (res, e) => {
  const end = e.endsAt
    ? new Date(e.endsAt)
    : new Date(new Date(e.startsAt).getTime() + THREE_HOURS);

  if (e.endsAt && new Date(e.endsAt) <= new Date(e.startsAt)) {
    res.status(400);
    throw new Error("The end time must be after the start time");
  }
  if (e.registrationDeadline && new Date(e.registrationDeadline) > end) {
    res.status(400);
    throw new Error("The application deadline must be before the event ends");
  }
};

/* ---------- public ---------- */

export const getEvents = asyncHandler(async (req, res) => {
  const now = new Date();
  const events = await Event.find({ isPublished: true }).sort({ startsAt: 1 });
  const taken = await seatsTakenMap(events.map((e) => e._id));
  const all = events.map((e) => decorate(e, taken.get(String(e._id)) || 0, now));

  const past = req.query.when === "past";
  const list = all.filter((e) => (past ? e.state === "ended" : e.state !== "ended"));
  if (past) list.reverse(); // most recent first
  res.json(list);
});

export const getEventBySlug = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug, isPublished: true });
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  const taken = (await seatsTakenMap([event._id])).get(String(event._id)) || 0;
  res.json(decorate(event, taken));
});

export const registerForEvent = asyncHandler(async (req, res) => {
  // honeypot: bots fill hidden fields, humans don't
  if (req.body.website) {
    return res.status(201).json({ message: "Application received" });
  }

  const event = await Event.findOne({ slug: req.params.slug, isPublished: true });
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  const taken = (await seatsTakenMap([event._id])).get(String(event._id)) || 0;
  const info = decorate(event, taken);

  if (!info.registrationsOpen) {
    res.status(400);
    throw new Error(
      info.state === "ended"
        ? "This event has ended"
        : info.spotsLeft === 0
        ? "This event is full"
        : "Applications are closed for this event"
    );
  }

  const data = pick(req.body, ["name", "email", "phone", "guests", "note"]);
  const guests = Math.min(Math.max(Number(data.guests) || 1, 1), 10);

  if (info.spotsLeft !== null && guests > info.spotsLeft) {
    res.status(400);
    throw new Error(`Only ${info.spotsLeft} spot(s) left`);
  }

  // answers to the event's custom questions, validated against the event
  const given =
    req.body.answers && typeof req.body.answers === "object" ? req.body.answers : {};
  const answers = [];
  for (const q of event.questions) {
    const value = String(given[String(q._id)] ?? "").trim().slice(0, 500);
    if (!value) {
      if (q.required) {
        res.status(400);
        throw new Error(`Please answer: ${q.label}`);
      }
      continue;
    }
    if (q.type === "select" && !q.options.includes(value)) {
      res.status(400);
      throw new Error(`Invalid answer for: ${q.label}`);
    }
    answers.push({ question: q.label, answer: value });
  }

  try {
    const reg = await Registration.create({
      ...data,
      guests,
      answers,
      eventId: event._id,
    });
    notifyNewApplication(event, reg);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      throw new Error("This email has already applied to this event");
    }
    throw err;
  }

  res.status(201).json({ message: "Application received" });
});

/* ---------- admin ---------- */

export const getEventsAdmin = asyncHandler(async (req, res) => {
  const now = new Date();
  const events = await Event.find().sort({ startsAt: -1 });

  const rows = await Registration.aggregate([
    {
      $group: {
        _id: { e: "$eventId", s: "$status" },
        count: { $sum: 1 },
        seats: { $sum: "$guests" },
      },
    },
  ]);
  const info = new Map();
  for (const r of rows) {
    const key = String(r._id.e);
    const cur = info.get(key) || { pending: 0, approved: 0, rejected: 0, seats: 0 };
    cur[r._id.s] = r.count;
    if (r._id.s !== "rejected") cur.seats += r.seats;
    info.set(key, cur);
  }

  res.json(
    events.map((e) => {
      const i = info.get(String(e._id)) || { pending: 0, approved: 0, rejected: 0, seats: 0 };
      return {
        ...decorate(e, i.seats, now),
        applicants: { pending: i.pending, approved: i.approved, rejected: i.rejected },
      };
    })
  );
});

export const createEvent = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (data.questions !== undefined) data.questions = cleanQuestions(data.questions);
  checkDates(res, data);
  const event = await Event.create(data);
  res.status(201).json(event);
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  const data = pick(req.body, FIELDS);
  if (data.questions !== undefined) data.questions = cleanQuestions(data.questions);
  event.set(data);
  checkDates(res, event);
  await event.save();
  res.json(event);
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  await Registration.deleteMany({ eventId: event._id });
  if (event.coverImage?.publicId) {
    await cloudinary.uploader.destroy(event.coverImage.publicId).catch(() => {});
  }
  await event.deleteOne();
  res.json({ message: "Event deleted" });
});

export const getRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  const registrations = await Registration.find({ eventId: event._id }).sort({
    createdAt: -1,
  });
  const seats = registrations
    .filter((r) => r.status !== "rejected")
    .reduce((sum, r) => sum + r.guests, 0);

  res.json({ event: decorate(event, seats), registrations });
});

export const updateRegistration = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["pending", "approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }
  const reg = await Registration.findByIdAndUpdate(
    req.params.regId,
    { status },
    { new: true }
  );
  if (!reg) {
    res.status(404);
    throw new Error("Application not found");
  }
  if (status !== "pending") {
    const ev = await Event.findById(reg.eventId);
    if (ev) notifyApplicationStatus(ev, reg);
  }
  res.json(reg);
});

export const deleteRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findByIdAndDelete(req.params.regId);
  if (!reg) {
    res.status(404);
    throw new Error("Application not found");
  }
  res.json({ message: "Application deleted" });
});