import { pool } from "../config/postgres.js";
import { rankProductByRelevance } from "../services/aiService.js";

const searchProducts = async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category || null;

        if (!query || query.trim() === "") {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }

        const pattern = `%${query}%`;

        // Broad SQL search — candidate pool (max 50 for AI ranking)
        let candidateQuery = `
            SELECT p.*, u.name AS seller_name, u.shop_name AS seller_shop
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE (p.name ILIKE $1 OR p.description ILIKE $1 OR p.category ILIKE $1 OR p.sub_category ILIKE $1)`;
        const params = [pattern];

        if (category) {
            params.push(category);
            candidateQuery += ` AND p.category = $${params.length}`;
        }

        candidateQuery += ` ORDER BY p.date DESC LIMIT 50`;

        const { rows: candidates } = await pool.query(candidateQuery, params);

        // Count total matches
        let countQuery = `SELECT COUNT(*) FROM products WHERE (name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1 OR sub_category ILIKE $1)`;
        const countParams = [pattern];
        if (category) {
            countParams.push(category);
            countQuery += ` AND category = $${countParams.length}`;
        }
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);

        let finalProducts = candidates;
        let searchMethod = "keyword";

        // Try AI ranking if we have candidates
        if (candidates.length > 0) {
            const ranked = await rankProductByRelevance(query, candidates);
            if (ranked && Array.isArray(ranked)) {
                // AI returns 1-based indices — convert to 0-based
                const reordered = ranked
                    .map((num) => candidates[num - 1])
                    .filter((p) => p !== undefined);
                if (reordered.length > 0) {
                    finalProducts = reordered;
                    searchMethod = "ai";
                }
            }
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        const paginated = finalProducts.slice(offset, offset + limit);

        res.status(200).json({
            success: true,
            products: paginated,
            total,
            page,
            limit,
            searchMethod,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSuggestions = async (req, res) => {
    try {
        const query = req.query.q || req.query.query;

        if (!query || query.length < 2) {
            return res.status(400).json({ success: false, message: "Query must be at least 2 characters" });
        }

        const pattern = `%${query}%`;

        // Fast DB-only lookups — no AI call (auto-complete must be instant)
        const [productResult, categoryResult] = await Promise.all([
            pool.query("SELECT DISTINCT name FROM products WHERE name ILIKE $1 LIMIT 5", [pattern]),
            pool.query("SELECT DISTINCT category FROM products WHERE category ILIKE $1 LIMIT 5", [pattern]),
        ]);

        res.status(200).json({
            success: true,
            productNames: productResult.rows.map((r) => r.name),
            categories: categoryResult.rows.map((r) => r.category),
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { searchProducts, getSuggestions };