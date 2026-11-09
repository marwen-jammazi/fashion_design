import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never returned in queries by default
    },
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function () {
  // this site has exactly one admin: refuse to create a second account
  if (this.isNew && (await this.constructor.countDocuments()) > 0) {
    throw new Error("Only one admin account is allowed");
  }

  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("Admin", adminSchema);