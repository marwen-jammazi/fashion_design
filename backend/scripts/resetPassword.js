import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

dotenv.config();

const run = async () => {
  const newPassword = process.argv[2];

  if (!newPassword || newPassword.length < 8) {
    console.error('Usage: node scripts/resetPassword.js "NewPassword123"  (at least 8 characters)');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const admin = await Admin.findOne();
  if (!admin) {
    console.error("No admin account exists. Run scripts/seedAdmin.js first.");
    process.exit(1);
  }

  admin.password = newPassword;
  admin.failedLogins = 0;
  admin.lockUntil = undefined;
  await admin.save();

  console.log(`Password reset for ${admin.email}. Every old session is now logged out.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});