import { pool } from "../config/postgres.js";
import { chatWithContext, getSearchIntent, scoreProductForIntent } from "../services/aiService.js";

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

        const intent = getSearchIntent(message);
        const terms = intent.terms.slice(0, 8);
        let products = [];

        if (terms.length > 0) {
            const patterns = terms.map((term) => `%${term}%`);
            const conditions = terms.map((_, index) => {
                const param = `$${index + 1}`;
                return `(p.name ILIKE ${param} OR p.description ILIKE ${param} OR p.category ILIKE ${param} OR p.sub_category ILIKE ${param})`;
            });

            const { rows } = await pool.query(
                `SELECT p.id, p.name, p.category, p.sub_category, p.price, p.image, p.sizes, p.bestseller,
                        SUBSTRING(p.description FROM 1 FOR 220) AS description
                 FROM products p
                 WHERE ${conditions.join(" OR ")}
                 ORDER BY p.bestseller DESC, p.date DESC
                 LIMIT 40`,
                patterns
            );
            products = rows;
        }

        if (products.length === 0) {
            const { rows } = await pool.query(
                `SELECT p.id, p.name, p.category, p.sub_category, p.price, p.image, p.sizes, p.bestseller,
                        SUBSTRING(p.description FROM 1 FOR 220) AS description
                 FROM products p
                 ORDER BY p.bestseller DESC, p.date DESC
                 LIMIT 40`
            );
            products = rows;
        }

        products = products
            .map((product) => ({
                ...product,
                semanticScore: scoreProductForIntent(product, intent),
            }))
            .sort((a, b) => b.semanticScore - a.semanticScore || Number(b.bestseller) - Number(a.bestseller))
            .slice(0, 20);

        // Call AI
        const aiResult = await chatWithContext(message, conversationHistory, products);

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
