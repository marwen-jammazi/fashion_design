import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

dotenv.config();

const run = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  if ((await Admin.countDocuments()) > 0) {
    console.log("An admin account already exists. Nothing to do.");
  } else {
    await Admin.create({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});