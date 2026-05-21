import { pool } from "../config/postgres.js";
import { summarizeReviews } from "../services/aiService.js";

/**
 * Add or update a review for a product.
 * Uses INSERT ... ON CONFLICT to upsert (one review per user per product).
 * Invalidates the cached AI summary when a new review is added.
 */
const addReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, rating, comment } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: "productId is required" });
        }

        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ success: false, message: "rating must be an integer between 1 and 5" });
        }

        // Verify purchase
        const { rows: orderRows } = await pool.query(
            "SELECT items FROM orders WHERE user_id = $1 AND payment = true",
            [userId]
        );
        let hasPurchased = false;
        for (const order of orderRows) {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            if (Array.isArray(items) && items.some(item => item._id === productId)) {
                hasPurchased = true;
                break;
            }
        }
        if (!hasPurchased) {
            return res.json({ success: false, message: "You can only review products you have purchased" });
        }

        const { rows: productRows } = await pool.query(
            "SELECT id FROM products WHERE id = $1 LIMIT 1",
            [productId]
        );
        if (productRows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const { rows } = await pool.query(
            `INSERT INTO reviews (product_id, user_id, rating, comment, date)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (product_id, user_id)
             DO UPDATE SET rating = $3, comment = $4, date = $5
             RETURNING *`,
            [productId, userId, ratingNum, comment || null, Date.now()]
        );

        res.status(200).json({ success: true, message: "Review submitted successfully", review: rows[0] });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Get all reviews for a product plus aggregate statistics.
 * Returns individual reviews (with reviewer name) and stats breakdown (avg rating, star counts).
 */
const getProductReview = async (req, res) => {
    try {
        const { productId } = req.params;

        // Fetch individual reviews joined with user names
        const { rows: reviews } = await pool.query(
            `SELECT r.id, r.rating, r.comment, r.date, r.user_id, u.name AS reviewer_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = $1
             ORDER BY r.date DESC`,
            [productId]
        );

        // Compute aggregate stats
        const { rows: statsRows } = await pool.query(
            `SELECT
                COUNT(*) AS total_reviews,
                ROUND(AVG(rating)::numeric, 1) AS average_rating,
                COUNT(*) FILTER (WHERE rating = 5) AS five_star,
                COUNT(*) FILTER (WHERE rating = 4) AS four_star,
                COUNT(*) FILTER (WHERE rating = 3) AS three_star,
                COUNT(*) FILTER (WHERE rating = 2) AS two_star,
                COUNT(*) FILTER (WHERE rating = 1) AS one_star
             FROM reviews
             WHERE product_id = $1`,
            [productId]
        );

        const stats = statsRows[0];

        res.status(200).json({
            success: true,
            reviews,
            stats: {
                total_reviews: parseInt(stats.total_reviews) || 0,
                average_rating: parseFloat(stats.average_rating) || 0,
                five_star: parseInt(stats.five_star) || 0,
                four_star: parseInt(stats.four_star) || 0,
                three_star: parseInt(stats.three_star) || 0,
                two_star: parseInt(stats.two_star) || 0,
                one_star: parseInt(stats.one_star) || 0,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a review.
 * Regular users can only delete their own review.
 * Admins can delete any review (checks role in DB).
 */
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.userId;

        // Check if user is admin
        const { rows: userRows } = await pool.query(
            "SELECT role FROM users WHERE id = $1 LIMIT 1",
            [userId]
        );
        const isAdmin = userRows[0]?.role === "admin";

        let result;
        if (isAdmin) {
            // Admin can delete any review
            result = await pool.query(
                "DELETE FROM reviews WHERE id = $1 RETURNING product_id",
                [reviewId]
            );
        } else {
            // Regular user can only delete their own
            result = await pool.query(
                "DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING product_id",
                [reviewId, userId]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Review not found or not authorized to delete" });
        }

        // Invalidate cached summary
        await pool.query(
            "DELETE FROM review_summaries WHERE product_id = $1",
            [result.rows[0].product_id]
        );

        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * AI-powered: Generate a summary of all reviews for a product.
 * Uses cache (review_summaries table) to avoid redundant AI calls.
 * Requires at least 3 reviews with comments to generate a summary.
 */
const getReviewSummary = async (req, res) => {
    try {
        const { productId } = req.params;

        const { rows: cacheRows } = await pool.query(
            "SELECT summary, pros, cons FROM review_summaries WHERE product_id = $1 AND is_shared = true",
            [productId]
        );

        if (cacheRows.length > 0 && cacheRows[0].summary) {
            return res.status(200).json({
                success: true,
                summary: cacheRows[0].summary,
                pros: cacheRows[0].pros,
                cons: cacheRows[0].cons,
            });
        }

        return res.status(200).json({
            success: true,
            summary: null,
            message: "No review summary available yet."
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const generateSummary = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rows: reviews } = await pool.query(
            "SELECT rating, comment FROM reviews WHERE product_id = $1 AND comment IS NOT NULL AND comment != ''",
            [productId]
        );

        if (reviews.length === 0) {
            return res.json({ success: false, message: "Not enough reviews to summarize." });
        }

        const result = await summarizeReviews(reviews);
        if (!result) return res.json({ success: false, message: "Failed to generate summary." });

        await pool.query(
            `INSERT INTO review_summaries (product_id, draft_summary, draft_pros, draft_cons, review_count, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (product_id)
             DO UPDATE SET draft_summary = $2, draft_pros = $3, draft_cons = $4, review_count = $5, updated_at = $6`,
            [productId, result.summary, JSON.stringify(result.pros), JSON.stringify(result.cons), reviews.length, Date.now()]
        );

        res.json({ success: true, message: "Summary generated", draft_summary: result.summary, draft_pros: result.pros, draft_cons: result.cons });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const shareSummary = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rows } = await pool.query("SELECT draft_summary, draft_pros, draft_cons FROM review_summaries WHERE product_id = $1", [productId]);
        if (rows.length === 0 || !rows[0].draft_summary) {
            return res.json({ success: false, message: "No draft summary to share. Please summarize first." });
        }
        await pool.query(
            `UPDATE review_summaries SET summary = draft_summary, pros = draft_pros, cons = draft_cons, is_shared = true WHERE product_id = $1`,
            [productId]
        );
        res.json({ success: true, message: "Summary shared successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getSellerReviewSummary = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rows } = await pool.query("SELECT * FROM review_summaries WHERE product_id = $1", [productId]);
        if (rows.length === 0) return res.json({ success: true, data: null });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addReview, getProductReview, deleteReview, getReviewSummary, generateSummary, shareSummary, getSellerReviewSummary };