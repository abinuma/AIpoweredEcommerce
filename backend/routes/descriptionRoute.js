import { Router } from "express";
import { generateDescription, regenerateDescription } from "../controllers/descriptionController.js";
import sellerAuth from "../middleware/sellerAuth.js";

const router = Router();

router.post("/generate", sellerAuth, generateDescription);
router.post("/regenerate", sellerAuth, regenerateDescription);

export default router;