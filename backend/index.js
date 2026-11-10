import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET is missing or too short (use at least 32 random characters). Refusing to start.");
  process.exit(1);
}

connectDB();

const app = express();
const isProd = process.env.NODE_ENV === "production";

// behind Render's proxy, trust it so req.ip is the real visitor address
// (rate limits and the login lockout depend on it)
if (isProd) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

// CLIENT_URL can hold several addresses separated by commas
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // no Origin header = not a browser (curl, health checks): allow
      cb(null, !origin || allowedOrigins.includes(origin));
    },
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan(isProd ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Portfolio API is running" });
});

// shows the address the server sees for you (used once to check the proxy setting)
app.get("/api/ip", (req, res) => res.json({ ip: req.ip }));

app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/events", eventRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));