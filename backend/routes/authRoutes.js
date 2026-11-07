import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 attempts per IP
  message: { message: "Too many login attempts, try again in 15 minutes" },
});

router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);

export default router;