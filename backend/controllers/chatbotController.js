import { pool } from "../config/postgres.js";
import { chatWithContext } from "../services/aiService.js";

// Common stop words to filter out when extracting keywords from messages
const STOP_WORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "like",
    "through", "after", "over", "between", "out", "against", "during",
    "without", "before", "under", "around", "among", "i", "me", "my",
    "you", "your", "we", "our", "they", "them", "their", "it", "its",
    "this", "that", "these", "those", "what", "which", "who", "whom",
    "how", "when", "where", "why", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "any", "no", "not", "only",
    "same", "so", "than", "too", "very", "just", "because", "but", "and",
    "or", "if", "then", "else", "also", "here", "there", "want", "need",
    "looking", "show", "get", "find", "tell", "help", "please",
]);

/**
 * Start a new chat session.
 * user_id is optional (null for guests).
 */
const startSession = async (req, res) => {
    try {
        const userId = req.body.user_id || null;

        const { rows } = await pool.query(
            `INSERT INTO chat_sessions (user_id, created_at, updated_at)
             VALUES ($1, $2, $2)
             RETURNING id`,
            [userId, Date.now()]
        );

        res.status(201).json({ success: true, sessionId: rows[0].id });
    } catch (error) {
        console.log("Error starting chat session:", error.message);
        res.status(500).json({ success: false, message: "Failed to start chat session" });
    }
};

/**
 * Send a message in a chat session and get an AI response.
 * 1. Saves user message to chat_messages
 * 2. Fetches conversation history (last 10 messages)
 * 3. Searches products for relevant context
 * 4. Calls AI with context
 * 5. Saves AI response to chat_messages
 * 6. Returns both the AI reply and any suggested products
 */
const sendMessage = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        // Verify session exists
        const { rows: sessionRows } = await pool.query(
            "SELECT id FROM chat_sessions WHERE id = $1 LIMIT 1",
            [sessionId]
        );
        if (sessionRows.length === 0) {
            return res.status(404).json({ success: false, message: "Chat session not found" });
        }

        // Save user's message
        await pool.query(
            `INSERT INTO chat_messages (session_id, role, message, created_at)
             VALUES ($1, 'user', $2, $3)`,
            [sessionId, message, Date.now()]
        );

        // Fetch last 10 messages for conversation history
        const { rows: historyRows } = await pool.query(
            `SELECT role, message AS content FROM chat_messages
             WHERE session_id = $1
             ORDER BY created_at DESC LIMIT 10`,
            [sessionId]
        );
        const conversationHistory = historyRows.reverse(); // oldest first

        // Extract keywords from the user's message for product search
        const keywords = message
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

        // Fetch relevant products based on keywords
        let productContext = "No matching products found.";
        if (keywords.length > 0) {
            const conditions = keywords.map((_, i) => `(p.name ILIKE $${i + 1} OR p.description ILIKE $${i + 1} OR p.category ILIKE $${i + 1})`);
            const patterns = keywords.map((k) => `%${k}%`);

            const { rows: products } = await pool.query(
                `SELECT p.id, p.name, p.category, p.price, SUBSTRING(p.description FROM 1 FOR 100) AS description
                 FROM products p
                 WHERE ${conditions.join(" OR ")}
                 LIMIT 15`,
                patterns
            );

            if (products.length > 0) {
                productContext = products
                    .map((p) => `Product: ${p.name}, Category: ${p.category}, Price: $${p.price}, Description: ${p.description}..., ID: ${p.id}`)
                    .join("\n");
            }
        }

        // Call AI
        const aiResult = await chatWithContext(message, conversationHistory, productContext);

        // Save AI response
        await pool.query(
            `INSERT INTO chat_messages (session_id, role, message, created_at)
             VALUES ($1, 'assistant', $2, $3)`,
            [sessionId, aiResult.reply, Date.now()]
        );

        // Update session timestamp
        await pool.query(
            "UPDATE chat_sessions SET updated_at = $1 WHERE id = $2",
            [Date.now(), sessionId]
        );

        // Fetch full product objects for suggested products
        let suggestedProducts = [];
        if (aiResult.suggestedProducts && aiResult.suggestedProducts.length > 0) {
            const placeholders = aiResult.suggestedProducts.map((_, i) => `$${i + 1}`).join(", ");
            const { rows } = await pool.query(
                `SELECT id AS "_id", name, description, price, image, category, sub_category AS "subCategory", sizes, bestseller, date
                 FROM products WHERE id IN (${placeholders})`,
                aiResult.suggestedProducts
            );
            suggestedProducts = rows;
        }

        res.status(200).json({
            success: true,
            reply: aiResult.reply,
            suggestedProducts,
        });
    } catch (error) {
        console.log("Error sending message:", error.message);
        res.status(500).json({ success: false, message: "Failed to process message" });
    }
};

/**
 * Get all messages in a chat session, ordered chronologically.
 */
const getSessionHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Verify session exists
        const { rows: sessionRows } = await pool.query(
            "SELECT id FROM chat_sessions WHERE id = $1 LIMIT 1",
            [sessionId]
        );
        if (sessionRows.length === 0) {
            return res.status(404).json({ success: false, message: "Chat session not found" });
        }

        const { rows: messages } = await pool.query(
            `SELECT id, role, message AS content, created_at AS date
             FROM chat_messages
             WHERE session_id = $1
             ORDER BY created_at ASC`,
            [sessionId]
        );

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.log("Error getting session history:", error.message);
        res.status(500).json({ success: false, message: "Failed to get session history" });
    }
};

/**
 * Delete a chat session and all its messages (CASCADE).
 * Only the session owner or an admin can delete.
 */
const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId;

        // Check user role for admin bypass
        const { rows: userRows } = await pool.query(
            "SELECT role FROM users WHERE id = $1 LIMIT 1",
            [userId]
        );
        const isAdmin = userRows[0]?.role === "admin";

        let result;
        if (isAdmin) {
            result = await pool.query("DELETE FROM chat_sessions WHERE id = $1 RETURNING id", [sessionId]);
        } else {
            result = await pool.query(
                "DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING id",
                [sessionId, userId]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Session not found or not authorized" });
        }

        res.status(200).json({ success: true, message: "Session deleted successfully" });
    } catch (error) {
        console.log("Error deleting session:", error.message);
        res.status(500).json({ success: false, message: "Failed to delete session" });
    }
};

export { startSession, sendMessage, getSessionHistory, deleteSession };