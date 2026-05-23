import { pool } from "../config/postgres.js";
import {
    getSearchIntent,
    rankProductByRelevance,
    scoreProductForIntent,
} from "../services/aiService.js";

const toProductResponse = (product) => ({
    _id: product.id,
    id: product.id,
    name: product.name,
    seller_id: product.seller_id,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category,
    subCategory: product.sub_category,
    sizes: product.sizes,
    bestseller: product.bestseller,
    date: product.date,
    seller_name: product.seller_name,
    seller_shop: product.seller_shop,
});

const searchProducts = async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category || null;

        if (!query || query.trim() === "") {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }

        const intent = getSearchIntent(query);
        const terms = intent.terms.slice(0, 10);
        const params = [];
        const filters = ["p.restricted = false"];

        if (terms.length > 0) {
            const termConditions = terms.map((term) => {
                params.push(`%${term}%`);
                return `(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.category ILIKE $${params.length} OR p.sub_category ILIKE $${params.length})`;
            });
            filters.push(`(${termConditions.join(" OR ")})`);
        }

        const activeCategory = category || intent.categories[0] || null;
        if (activeCategory) {
            params.push(activeCategory);
            filters.push(`p.category = $${params.length}`);
        }

        if (intent.subCategories.length > 0) {
            params.push(intent.subCategories);
            filters.push(`p.sub_category = ANY($${params.length}::text[])`);
        }

        if (intent.maxPrice) {
            params.push(intent.maxPrice);
            filters.push(`p.price <= $${params.length}`);
        }

        if (intent.minPrice) {
            params.push(intent.minPrice);
            filters.push(`p.price >= $${params.length}`);
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
        const { rows: candidateRows } = await pool.query(
            `SELECT p.*, u.name AS seller_name, u.shop_name AS seller_shop
             FROM products p
             JOIN users u ON p.seller_id = u.id
             ${whereClause}
             ORDER BY p.bestseller DESC, p.date DESC
             LIMIT 100`,
            params
        );

        let candidates = candidateRows;

        if (candidates.length === 0 && terms.length > 0) {
            const fallbackParams = terms.map((term) => `%${term}%`);
            const fallbackConditions = terms.map((_, index) => {
                const param = `$${index + 1}`;
                return `(p.name ILIKE ${param} OR p.description ILIKE ${param} OR p.category ILIKE ${param} OR p.sub_category ILIKE ${param})`;
            });
            const { rows } = await pool.query(
                `SELECT p.*, u.name AS seller_name, u.shop_name AS seller_shop
                 FROM products p
                 JOIN users u ON p.seller_id = u.id
                 WHERE p.restricted = false AND (${fallbackConditions.join(" OR ")})
                 ORDER BY p.bestseller DESC, p.date DESC
                 LIMIT 100`,
                fallbackParams
            );
            candidates = rows;
        }

        if (candidates.length === 0) {
            const { rows } = await pool.query(
                `SELECT p.*, u.name AS seller_name, u.shop_name AS seller_shop
                 FROM products p
                 JOIN users u ON p.seller_id = u.id
                 WHERE p.restricted = false
                 ORDER BY p.bestseller DESC, p.date DESC
                 LIMIT 100`
            );
            candidates = rows;
        }

        const semanticRanked = candidates
            .map((product) => ({
                ...product,
                semanticScore: scoreProductForIntent(product, intent),
            }))
            .sort((a, b) => b.semanticScore - a.semanticScore || b.date - a.date);

        let finalProducts = semanticRanked;
        let searchMethod = "semantic";

        const aiRanked = await rankProductByRelevance(query, semanticRanked.slice(0, 50));
        if (aiRanked && Array.isArray(aiRanked)) {
            const reordered = aiRanked
                .map((num) => semanticRanked[num - 1])
                .filter(Boolean);
            if (reordered.length > 0) {
                const included = new Set(reordered.map((product) => product.id));
                finalProducts = [
                    ...reordered,
                    ...semanticRanked.filter((product) => !included.has(product.id)),
                ];
                searchMethod = "ai-semantic";
            }
        }

        const meaningfulProducts = finalProducts.filter((product) => product.semanticScore > 0);
        if (meaningfulProducts.length > 0) {
            finalProducts = meaningfulProducts;
        }

        const offset = (page - 1) * limit;
        const paginated = finalProducts.slice(offset, offset + limit).map(toProductResponse);

        res.status(200).json({
            success: true,
            products: paginated,
            total: finalProducts.length,
            page,
            limit,
            totalPages: Math.ceil(finalProducts.length / limit),
            searchMethod,
            interpretedQuery: intent,
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

        const intent = getSearchIntent(query);
        const terms = intent.terms.length > 0 ? intent.terms.slice(0, 5) : [query];
        const params = terms.map((term) => `%${term}%`);
        const conditions = terms.map((_, index) => {
            const param = `$${index + 1}`;
            return `(name ILIKE ${param} OR category ILIKE ${param} OR sub_category ILIKE ${param})`;
        });

        const [productResult, categoryResult] = await Promise.all([
            pool.query(
                `SELECT DISTINCT name FROM products WHERE ${conditions.join(" OR ")} LIMIT 6`,
                params
            ),
            pool.query(
                `SELECT DISTINCT category FROM products WHERE ${conditions.join(" OR ")} LIMIT 5`,
                params
            ),
        ]);

        res.status(200).json({
            success: true,
            productNames: productResult.rows.map((row) => row.name),
            categories: [...new Set([...intent.categories, ...categoryResult.rows.map((row) => row.category)])],
            interpretedQuery: intent,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { searchProducts, getSuggestions };
