import jwt from 'jsonwebtoken';
import { pool } from '../config/postgres.js';

const authUser = async (req,res,next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.json({success: false, message: 'Not  Authorized Login Again'})
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        // req.body.userId = token_decode.id;
        req.userId = token_decode.id;
        next();
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

export const isSuspended = async (req,res,next) => {
    try {
        const {rows} = await pool.query("SELECT suspended FROM users WHERE id=$1 LIMIT 1 ", [req.userId])
        if (rows[0].suspended) {
            return res.status(403).json({success:false,message:"your account has been suspended"})
        }
        next();
    } catch (error) {
        console.log(error)
        res.status(500).json({success: false, message: error.message})
    }
}

export default authUser;
