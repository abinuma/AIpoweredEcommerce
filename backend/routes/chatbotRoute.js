import { Router } from "express";
import { startSession, sendMessage, getSessionHistory, deleteSession } from "../controllers/chatbotController.js";
import authUser from "../middleware/auth.js";

const router = Router();

router.post("/session",authUser,startSession);
router.post("/:sessionId/message",authUser, sendMessage);
router.get("/:sessionId/history",authUser, getSessionHistory);
router.delete("/:sessionId", authUser, deleteSession);
router.delete("/message/:messageId", authUser, deleteMessage);

export default router;