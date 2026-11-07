import mongoose from "mongoose";
import slugify from "slugify";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
   collectionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Collection",
  required: true,
},
    description: { type: String, default: "" },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        alt: { type: String, default: "" },
      },
    ],
    tags: [{ type: String, trim: true }], // e.g. ["evening wear", "silk"]
    materials: { type: String, default: "" },
    year: { type: Number },
    featured: { type: Boolean, default: false }, // show on homepage
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

projectSchema.pre("validate", function () {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

export default mongoose.model("Project", projectSchema);