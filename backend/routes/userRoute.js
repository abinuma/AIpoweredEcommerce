import express from "express"
import { loginUser,registerUser,adminLogin,getProfile, updateShopProfile } from "../controllers/userController.js";
import authUser from "../middleware/auth.js";
const userRouter = express.Router()

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);
userRouter.post("/admin",adminLogin);
userRouter.get("/profile",authUser,getProfile);
userRouter.post("/update-shop-profile",authUser,updateShopProfile);
 
export default userRouter;
