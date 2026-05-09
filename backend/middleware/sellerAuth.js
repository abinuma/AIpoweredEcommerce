import jwt from "jsonwebtoken";
import { pool } from "../config/postgres.js";

const sellerAuth = async (req,res,next) => {
    try {
        const token= req.headers.authorization
 if (!token) {
    return res.status(401).json({success:false,message:"not authorized login again"})
 }   
 const token_decoded = jwt.verify(token,process.env.JWT_SECRET)
 const {rows} = await pool.query(
    "SELECT role FROM users WHERE id=$1 LIMIT 1 ",
    [token_decoded.id]
 )
 if (!rows[0] || (rows[0].role !== 'seller' && rows[0].role !== 'admin')) {
    return res.status(401).json({success:false,message:"not authorized login again"})
 }
 req.userId = token_decoded.id;
 next();
    } catch (error) {
        return res.status(500).json({success:false,message:error.message})
    }
 
}

export default sellerAuth;