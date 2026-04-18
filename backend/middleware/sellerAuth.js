import jwt from "jsonwebtoken";

const sellerAuth = async (req,res) => {
    try {
        const token= req.headers.authorization
 if (!token) {
    return res.status(401).json({success:false,message:"not authorized login again"})
 }   
 token_decoded = jwt.verify(token,process.env.JWT_SECRET)
 if (token_decoded.role !== 'seller') {
    return res.status(401).json({success:false,message:"not authorized login again"})
 }
 next();
    } catch (error) {
        return res.status(500).json({success:false,message:error.message})
    }
 
}

export default sellerAuth;