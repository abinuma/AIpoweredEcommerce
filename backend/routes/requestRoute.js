import express from "express";
import { sellerRequest,verifySellerRequest,getSellerRequest,checkRequestStatus } from "../controllers/requestController.js";
import authUser, { isSuspended } from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const requestRoute = express.Router()

requestRoute.post("/seller-request",authUser,isSuspended,sellerRequest)
requestRoute.get("/status",authUser,isSuspended,checkRequestStatus)
requestRoute.get("/seller-request",adminAuth,isSuspended,getSellerRequest)
requestRoute.patch("/verify-request",adminAuth,isSuspended,verifySellerRequest)

export default requestRoute