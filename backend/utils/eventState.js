import Registration from "../models/Registration.js";

const THREE_HOURS = 3 * 60 * 60 * 1000;

export const getEnd = (e) =>
  e.endsAt
    ? new Date(e.endsAt)
    : new Date(new Date(e.startsAt).getTime() + THREE_HOURS);

export const getDeadline = (e) =>
  e.registrationDeadline ? new Date(e.registrationDeadline) : new Date(e.startsAt);

export const getState = (e, now = new Date()) => {
  if (now < new Date(e.startsAt)) return "upcoming";
  if (now <= getEnd(e)) return "live";
  return "ended";
};

// seats already taken (pending + approved applications, counting guests)
export const seatsTakenMap = async (eventIds) => {
  const rows = await Registration.aggregate([
    { $match: { eventId: { $in: eventIds }, status: { $ne: "rejected" } } },
    { $group: { _id: "$eventId", seats: { $sum: "$guests" } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.seats]));
};

export const decorate = (event, seats = 0, now = new Date()) => {
  const obj = event.toObject ? event.toObject() : event;
  const state = getState(obj, now);
  const spotsLeft = obj.capacity > 0 ? Math.max(obj.capacity - seats, 0) : null;
  const registrationsOpen =
    obj.registrationOpen &&
    state !== "ended" &&
    now < getDeadline(obj) &&
    (spotsLeft === null || spotsLeft > 0);

  return {
    ...obj,
    state,
    endTime: getEnd(obj),
    seatsTaken: seats,
    spotsLeft,
    registrationsOpen,
  };
};