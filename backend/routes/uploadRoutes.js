import { Router } from "express";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import { uploadImages, deleteImage } from "../controllers/uploadController.js";

const router = Router();

router.post("/", protect, upload.array("images", 10), uploadImages);
router.delete("/", protect, deleteImage);

export default router;