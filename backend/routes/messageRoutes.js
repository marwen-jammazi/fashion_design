import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createMessage,
  getMessages,
  markRead,
  deleteMessage,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                   // 5 messages per IP per hour
  message: { message: "Too many messages, please try again later" },
});

router.route("/").post(contactLimiter, createMessage).get(protect, getMessages);
router.patch("/:id/read", protect, markRead);
router.delete("/:id", protect, deleteMessage);

export default router;