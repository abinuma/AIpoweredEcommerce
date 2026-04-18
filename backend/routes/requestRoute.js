import express from "express";
import { sellerRequest,verifySellerRequest,getSellerRequest } from "../controllers/requestController";

const requestRoute = express.Router()

requestRoute.post("/seller-request",sellerRequest)
requestRoute.get("/seller-request",getSellerRequest)
requestRoute.patch("/verify-request",verifySellerRequest)

export default requestRoute