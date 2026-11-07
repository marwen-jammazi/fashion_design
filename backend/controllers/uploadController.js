import cloudinary from "../config/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";

const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No images uploaded");
  }

  const results = await Promise.all(
    req.files.map((file) => uploadBuffer(file.buffer, "fashion-portfolio"))
  );

  res.status(201).json(
    results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
      width: r.width,
      height: r.height,
    }))
  );
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    res.status(400);
    throw new Error("publicId is required");
  }
  await cloudinary.uploader.destroy(publicId);
  res.json({ message: "Image deleted" });
});