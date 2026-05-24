import { pool } from "../config/postgres.js";

/**
 * Get nearby seller shops using Haversine formula for distance calculation.
 * Query params: lat, lng, radius (km, default 50), limit (default 20)
 */
const getNearByShop = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius) || 50;
        const limit = parseInt(req.query.limit) || 20;

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: "lat and lng are required and must be valid numbers" });
        }

        const { rows } = await pool.query(
            `WITH nearby AS (
                SELECT
                    id, name, shop_name, shop_description, latitude, longitude,
                    ( 6371 * acos(
                        cos(radians($1)) * cos(radians(latitude))
                        * cos(radians(longitude) - radians($2))
                        + sin(radians($1)) * sin(radians(latitude))
                    )) AS distance_km
                FROM users
                WHERE role = 'seller'
                  AND suspended = false
                  AND latitude IS NOT NULL
                  AND longitude IS NOT NULL
            )
            SELECT id, name, shop_name, shop_description, latitude, longitude, ROUND(distance_km::numeric, 2) AS distance_km
            FROM nearby
            WHERE distance_km <= $3
            ORDER BY distance_km ASC
            LIMIT $4`,
            [lat, lng, radius, limit]
        );

        res.status(200).json({ success: true, shops: rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get products from nearby sellers using Haversine formula.
 * Finds nearby sellers first, then JOINs with products.
 * Query params: lat, lng, radius (km, default 50), limit (default 40), category (optional)
 */
const getNearbyProducts = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius) || 50;
        const limit = parseInt(req.query.limit) || 40;
        const category = req.query.category || null;

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: "lat and lng are required and must be valid numbers" });
        }

        let query = `
            WITH nearby_sellers AS (
                SELECT
                    id AS seller_id, shop_name,
                    ( 6371 * acos(
                        cos(radians($1)) * cos(radians(latitude))
                        * cos(radians(longitude) - radians($2))
                        + sin(radians($1)) * sin(radians(latitude))
                    )) AS distance_km
                FROM users
                WHERE role = 'seller'
                  AND suspended = false
                  AND latitude IS NOT NULL
                  AND longitude IS NOT NULL
            )
            SELECT p.*, ns.shop_name, ROUND(ns.distance_km::numeric, 2) AS distance_km
            FROM nearby_sellers ns
            JOIN products p ON p.seller_id = ns.seller_id
            WHERE ns.distance_km <= $3`;

        const params = [lat, lng, radius];

        if (category) {
            params.push(category);
            query += ` AND p.category = $${params.length}`;
        }

        query += ` ORDER BY ns.distance_km ASC LIMIT $${params.length + 1}`;
        params.push(limit);

        const { rows } = await pool.query(query, params);

        res.status(200).json({ success: true, products: rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Seller updates their shop location.
 * Inputs from req.body: latitude, longitude
 * req.userId from auth middleware
 */
const updateSellerLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({ success: false, message: "latitude must be a number between -90 and 90" });
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ success: false, message: "longitude must be a number between -180 and 180" });
        }

        await pool.query(
            `UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3`,
            [lat, lng, req.userId]
        );

        res.status(200).json({ success: true, message: "Location Updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all seller shops.
 */
const getAllShops = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, name, shop_name, shop_description, latitude, longitude
            FROM users
            WHERE role = 'seller' AND suspended = false`
        );
        res.status(200).json({ success: true, shops: rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { getNearByShop, getNearbyProducts, updateSellerLocation, getAllShops };