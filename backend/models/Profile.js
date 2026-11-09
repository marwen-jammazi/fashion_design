import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    tagline: { type: String, default: "" },
    role: { type: String, default: "" }, // e.g. "Fashion Designer based in Tunis"
    bio: { type: String, default: "" },
    photo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    email: { type: String, default: "" },
    location: { type: String, default: "" },
    social: {
      instagram: { type: String, default: "" },
      pinterest: { type: String, default: "" },
      behance: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);