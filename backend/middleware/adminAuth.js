import jwt from "jsonwebtoken";
import { pool } from "../config/postgres.js";

const adminAuth = async (req,res,next) => {
    try {
        const token = req.headers.authorization
        if (!token) {
            return res.json({ success: false, message: "not Authorized login again" });
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        const {rows} = await pool.query(
            "SELECT role FROM users WHERE id=$1 LIMIT 1 ",
            [token_decode.id]
        )
        if (!rows[0] || rows[0].role !== "admin") {
            return res.status(403).json({success:false,message:"not Authorized login again"})
        }
       req.userId=token_decode.id;
        next();
    } catch (error) {
        return res.json({ success: false, message: error.message});
    }
}

export default adminAuth;
