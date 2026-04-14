import express from "express";
import {placeOrder,placeOrderStripe,placeOrderRazorpay,allOrders,userOrders,updateStatus,verifyStripe } from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

//Admin features
orderRouter.get("/list", adminAuth, allOrders);
orderRouter.patch("/status", adminAuth, updateStatus);

//payment features
orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/razorpay", authUser,placeOrderRazorpay);

//user features
orderRouter.get("/userorders", authUser, userOrders);

//verify payment
orderRouter.patch("/verifyStripe", authUser,verifyStripe)

export default orderRouter;