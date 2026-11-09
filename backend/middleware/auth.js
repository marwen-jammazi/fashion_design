import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    res.status(401);
    throw new Error("Not authorized, invalid or expired token");
  }

  const admin = await Admin.findById(decoded.id);
  if (!admin) {
    res.status(401);
    throw new Error("Not authorized");
  }

  // tokens issued before the last password change are no longer valid
  if (
    admin.passwordChangedAt &&
    decoded.iat < Math.floor(admin.passwordChangedAt.getTime() / 1000)
  ) {
    res.status(401);
    throw new Error("Session expired, please log in again");
  }

  req.admin = admin;
  next();
});