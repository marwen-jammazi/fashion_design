import Collection from "../models/Collection.js";
import Project from "../models/Project.js";
import asyncHandler from "../utils/asyncHandler.js";
import pick from "../utils/pick.js";

const FIELDS = [
  "title", "description", "season", "year",
  "coverImage", "order", "isPublished",
];

export const getCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ isPublished: true }).sort({
    order: 1,
    year: -1,
  });
  res.json(collections);
});

export const getCollectionBySlug = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({
    slug: req.params.slug,
    isPublished: true,
  });
  if (!collection) {
    res.status(404);
    throw new Error("Collection not found");
  }
  const projects = await Project.find({
    collectionId: collection._id,
    isPublished: true,
  }).sort({ order: 1, createdAt: -1 });

  res.json({ ...collection.toObject(), projects });
});

export const createCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.create(pick(req.body, FIELDS));
  res.status(201).json(collection);
});

export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) {
    res.status(404);
    throw new Error("Collection not found");
  }
  collection.set(pick(req.body, FIELDS));
  await collection.save();
  res.json(collection);
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) {
    res.status(404);
    throw new Error("Collection not found");
  }
  const count = await Project.countDocuments({ collectionId: collection._id });
  if (count > 0) {
    res.status(400);
    throw new Error(`Cannot delete: collection still has ${count} project(s)`);
  }
  await collection.deleteOne();
  res.json({ message: "Collection deleted" });
});