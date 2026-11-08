import { Router } from "express";
import {
  getCollections,
  getAllCollectionsAdmin,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection,
} from "../controllers/collectionController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.route("/").get(getCollections).post(protect, createCollection);
router.get("/admin/all", protect, getAllCollectionsAdmin);
router.get("/:slug", getCollectionBySlug);
router
  .route("/:id")
  .put(protect, updateCollection)
  .delete(protect, deleteCollection);

export default router;