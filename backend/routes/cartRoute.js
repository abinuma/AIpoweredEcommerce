import express from "express";
import { addToCart, getUserCart, updateCart } from "../controllers/cartController.js";
import authUser from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.get('/get', authUser, getUserCart)
cartRouter.patch('/update', authUser, updateCart)
cartRouter.post('/add', authUser, addToCart)

export default cartRouter;
