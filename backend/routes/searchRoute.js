import { Router } from "express";
import { getSuggestions, searchProducts } from "../controllers/searchController.js";

const router = Router();

router.get("/search", searchProducts);
router.get("/suggestions", getSuggestions);

export default router;