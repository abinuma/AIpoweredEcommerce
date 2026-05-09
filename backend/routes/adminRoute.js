import express from "express";
import { getAllUsers,getUserById,updateUserRole,suspendUser,deleteUser,getAllProducts,removeProductAdmin,getPlatformAnalytics } from "../controllers/adminController.js";
import adminAuth from "../middleware/adminAuth.js";

const adminRouter = express.Router();

adminRouter.get('/users',adminAuth,getAllUsers)
adminRouter.get('/users/:id',adminAuth,getUserById)
adminRouter.patch('/users/update',adminAuth,updateUserRole)
adminRouter.patch('/users/:id/suspend',adminAuth,suspendUser)
adminRouter.delete('/users/:id/delete',adminAuth,deleteUser)
adminRouter.get('/products',adminAuth,getAllProducts)
adminRouter.delete('/products/:id/delete',adminAuth,removeProductAdmin)
adminRouter.get('/analytics',adminAuth,getPlatformAnalytics)

export default adminRouter;