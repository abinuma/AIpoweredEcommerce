import express from "express";
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  adminListProducts,
  restrictProduct,
  unrestrictProduct,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";
import sellerAuth from "../middleware/sellerAuth.js";

const productRouter = express.Router();

const handleUpload = (req, res, next) => {
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be smaller than 5MB"
          : err.message || "Image upload failed";
      return res.status(400).json({ success: false, message });
    }
    next();
  });
};

productRouter.post("/add", handleUpload, sellerAuth, addProduct);
productRouter.delete("/:id", sellerAuth, removeProduct);
productRouter.post("/single", singleProduct);
productRouter.get("/list", listProducts);
productRouter.get("/admin-list", sellerAuth, adminListProducts);
productRouter.patch("/:id/restrict", adminAuth, restrictProduct);
productRouter.patch("/:id/unrestrict", adminAuth, unrestrictProduct);

export default productRouter;
