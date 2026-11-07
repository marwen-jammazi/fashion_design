import { Router } from "express";
import {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.route("/").get(getProjects).post(protect, createProject);
router.get("/:slug", getProjectBySlug);
router
  .route("/:id")
  .put(protect, updateProject)
  .delete(protect, deleteProject);

export default router;