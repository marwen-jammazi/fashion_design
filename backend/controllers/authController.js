import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notifyLockout } from "../utils/mailer.js";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

// compared against when the email is unknown, so response time
// does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const admin = await Admin.findOne({ email }).select(
    "+password +failedLogins +lockUntil"
  );

  if (admin?.lockUntil && admin.lockUntil > new Date()) {
    res.status(429);
    throw new Error("Too many failed attempts. Try again in 15 minutes.");
  }

  let valid = false;
  if (admin) valid = await admin.comparePassword(password);
  else await bcrypt.compare(password, DUMMY_HASH);

  if (!valid) {
    if (admin) {
      admin.failedLogins = (admin.failedLogins || 0) + 1;
      if (admin.failedLogins >= MAX_FAILS) {
        admin.lockUntil = new Date(Date.now() + LOCK_MS);
        admin.failedLogins = 0;
        notifyLockout(req.ip);
      }
      await admin.save();
    }
    // same message for wrong email or wrong password
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (admin.failedLogins || admin.lockUntil) {
    admin.failedLogins = 0;
    admin.lockUntil = undefined;
    await admin.save();
  }

  res.json({
    token: signToken(admin._id),
    admin: { id: admin._id, email: admin.email },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ id: req.admin._id, email: req.admin.email });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current and new password are required");
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("The new password must be at least 8 characters");
  }
  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error("The new password must be different from the current one");
  }

  const admin = await Admin.findById(req.admin._id).select("+password");

  // 400 on purpose: a 401 would make the frontend log the admin out
  if (!(await admin.comparePassword(currentPassword))) {
    res.status(400);
    throw new Error("The current password is wrong");
  }

  admin.password = newPassword; // hashed by the pre-save hook
  await admin.save();

  // old tokens stop working after a password change, so send a fresh one
  res.json({ message: "Password updated", token: signToken(admin._id) });
});