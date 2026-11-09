import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getEvents,
  getEventBySlug,
  registerForEvent,
  getEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  getRegistrations,
  updateRegistration,
  deleteRegistration,
} from "../controllers/eventController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                  // 10 applications per IP per hour
  message: { message: "Too many applications, please try again later" },
});

router.route("/").get(getEvents).post(protect, createEvent);
router.get("/admin/all", protect, getEventsAdmin);

router.patch("/registrations/:regId", protect, updateRegistration);
router.delete("/registrations/:regId", protect, deleteRegistration);

router.get("/:id/registrations", protect, getRegistrations);
router.post("/:slug/register", applyLimiter, registerForEvent);
router.get("/:slug", getEventBySlug);
router.route("/:id").put(protect, updateEvent).delete(protect, deleteEvent);

export default router;