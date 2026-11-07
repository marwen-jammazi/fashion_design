import mongoose from "mongoose";
import slugify from "slugify";

const collectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, default: "" },
    season: { type: String, default: "" }, // e.g. "Spring/Summer"
    year: { type: Number },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    order: { type: Number, default: 0 }, // for custom sorting
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

collectionSchema.pre("validate", function () {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

export default mongoose.model("Collection", collectionSchema);