import Project from "../models/Project.js";
import Collection from "../models/Collection.js";
import asyncHandler from "../utils/asyncHandler.js";
import pick from "../utils/pick.js";
import cloudinary from "../config/cloudinary.js";

const FIELDS = [
  "title", "collectionId", "description", "images", "tags",
  "materials", "year", "featured", "order", "isPublished",
];

export const getProjects = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.collection) filter.collectionId = req.query.collection;
  if (req.query.featured === "true") filter.featured = true;
  if (req.query.tag) filter.tags = req.query.tag;

  const projects = await Project.find(filter)
    .populate("collectionId", "title slug")
    .sort({ order: 1, createdAt: -1 });
  res.json(projects);
});

export const getProjectBySlug = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    slug: req.params.slug,
    isPublished: true,
  }).populate("collectionId", "title slug");
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  res.json(project);
});

export const createProject = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  const exists = await Collection.exists({ _id: data.collectionId });
  if (!exists) {
    res.status(400);
    throw new Error("Collection does not exist");
  }
  const project = await Project.create(data);
  res.status(201).json(project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  project.set(pick(req.body, FIELDS));
  await project.save();
  res.json(project);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  if (project.images && project.images.length > 0) {
    await Promise.all(
      project.images.map((img) => img.publicId && cloudinary.uploader.destroy(img.publicId))
    );
  }
  await project.deleteOne();
  res.json({ message: "Project deleted" });
});