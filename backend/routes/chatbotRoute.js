import { Router } from "express";
import { startSession, sendMessage, getSessionHistory, deleteSession } from "../controllers/chatbotController.js";
import authUser from "../middleware/auth.js";

const router = Router();

router.post("/session", startSession);
router.post("/:sessionId/message", sendMessage);
router.get("/:sessionId/history", getSessionHistory);
router.delete("/:sessionId", authUser, deleteSession);

export default router;