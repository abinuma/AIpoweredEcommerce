import express from "express";
import {placeOrder,placeOrderStripe,placeOrderRazorpay,allOrders,userOrders,updateStatus,verifyStripe } from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import sellerAuth from "../middleware/sellerAuth.js";
import authUser, { isSuspended } from "../middleware/auth.js";

const orderRouter = express.Router();

//Admin features
orderRouter.get("/list", sellerAuth, allOrders);
orderRouter.patch("/status", sellerAuth, updateStatus);

//payment features
orderRouter.post("/place", authUser, isSuspended,placeOrder);
orderRouter.post("/stripe", authUser, isSuspended,placeOrderStripe);
orderRouter.post("/razorpay", authUser, isSuspended,placeOrderRazorpay);

//user features
orderRouter.get("/userorders", authUser, userOrders);

//verify payment
orderRouter.patch("/verifyStripe", authUser,verifyStripe)

export default orderRouter;