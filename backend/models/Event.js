import mongoose from "mongoose";
import slugify from "slugify";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    category: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    location: { type: String, default: "", trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    registrationDeadline: { type: Date },
    capacity: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    price: { type: String, default: "Free", trim: true },
    registrationOpen: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// slug = title + start date, so recurring events can reuse a title
eventSchema.pre("validate", async function () {
  if (this.slug) return;
  const day = this.startsAt ? new Date(this.startsAt).toISOString().slice(0, 10) : "";
  const base = slugify(`${this.title} ${day}`, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  this.slug = slug;
});

export default mongoose.model("Event", eventSchema);