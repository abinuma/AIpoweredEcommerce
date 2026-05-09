import express from "express";
import { addToCart, getUserCart, updateCart } from "../controllers/cartController.js";
import authUser, { isSuspended } from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.get('/get', authUser, isSuspended, getUserCart)
cartRouter.patch('/update', authUser, isSuspended, updateCart)
cartRouter.post('/add', authUser, isSuspended, addToCart)

export default cartRouter;
