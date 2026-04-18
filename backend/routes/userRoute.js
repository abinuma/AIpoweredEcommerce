import express from "express"
import { loginUser,registerUser,adminLogin, becomeSeller, getSellerRequest, updateSellerRequest } from "../controllers/userController.js"
import adminAuth from "../middleware/adminAuth.js"

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/become-seller', becomeSeller)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminAuth,adminLogin)
userRouter.get('/seller-request', getSellerRequest)
userRouter.put('/seller-request', updateSellerRequest)

export default userRouter;

