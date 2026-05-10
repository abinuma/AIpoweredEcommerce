import express from "express";
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  adminListProducts,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";
import sellerAuth from "../middleware/sellerAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  sellerAuth,addProduct,
);
productRouter.delete("/:id", sellerAuth, removeProduct);
productRouter.post("/single",singleProduct);
productRouter.get("/list",listProducts);
productRouter.get("/admin-list", sellerAuth, adminListProducts);

export default productRouter;
