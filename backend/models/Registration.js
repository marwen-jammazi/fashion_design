import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    guests: { type: Number, default: 1, min: 1, max: 10 },
    note: { type: String, default: "", maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// one application per email per event
registrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

export default mongoose.model("Registration", registrationSchema);