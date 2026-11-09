import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import cloudinary from "../config/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import pick from "../utils/pick.js";
import { decorate, seatsTakenMap } from "../utils/eventState.js";

const FIELDS = [
  "title", "category", "description", "coverImage", "location",
  "startsAt", "endsAt", "registrationDeadline", "capacity",
  "price", "registrationOpen", "isPublished",
];

const checkDates = (res, e) => {
  if (e.endsAt && new Date(e.endsAt) <= new Date(e.startsAt)) {
    res.status(400);
    throw new Error("The end time must be after the start time");
  }
  if (
    e.registrationDeadline &&
    new Date(e.registrationDeadline) > new Date(e.startsAt)
  ) {
    res.status(400);
    throw new Error("The registration deadline must be before the event starts");
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

  try {
    await Registration.create({ ...data, guests, eventId: event._id });
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
  event.set(pick(req.body, FIELDS));
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