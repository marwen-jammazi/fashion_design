import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import asyncHandler from "../utils/asyncHandler.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // password has select:false in the model, so we ask for it explicitly
  const admin = await Admin.findOne({ email }).select("+password");

  // same message for wrong email or wrong password, so attackers learn nothing
  if (!admin || !(await admin.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    token: signToken(admin._id),
    admin: { id: admin._id, email: admin.email },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ id: req.admin._id, email: req.admin.email });
});