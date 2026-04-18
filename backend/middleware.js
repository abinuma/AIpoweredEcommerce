// --- adminAuth.js ---
import jwt from "jsonwebtoken";

const adminAuth = async (req,res,next) => {
    try {
        const token = req.headers.authorization
        if (!token) {
            return res.json({ success: false, message: "not Authorized login again" });
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: "not Authorized login again" });
        }
        next();
    } catch (error) {
        return res.json({ success: false, message: error.message});
    }
}

export default adminAuth;

// --- auth.js ---
import jwt from 'jsonwebtoken';

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

export default authUser;

// --- multer.js ---
import multer from 'multer';

const storage = multer.diskStorage({
    filename:function(req,file,callback){
        callback(null,file.originalname)
    }
})

const upload = multer({storage});

export default upload;
