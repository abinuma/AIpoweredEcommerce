import { v2 as cloudinary } from "cloudinary";
import { pool } from "../config/postgres.js";
import jwt from "jsonwebtoken";
// function for add product

const allowedSizes = ["S", "M", "L", "XL", "XXL"];
const sizeOrder = ["S", "M", "L", "XL", "XXL"];

const getProductValidationError = ({ name, description, price, category, subCategory, sizes, images }) => {
  if (!name?.trim()) return "Product name is required";
  if (!description?.trim()) return "Product description is required";
  if (!category?.trim()) return "Product category is required";
  if (!subCategory?.trim()) return "Product sub category is required";
  if (price === undefined || price === null || String(price).trim() === "") {
    return "Product price is required";
  }
  if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    return "Product price must be greater than 0";
  }
  if (!Array.isArray(sizes)) {
    return "Sizes must be an array";
  }
  if (!Array.isArray(images) || images.length === 0) {
    return "Upload at least one product image";
  }
  return null;
};

const addProduct = async (req, res) => {
  try {
    if (req.role === 'admin') {
    if (req.role === 'admin') {
      return res.status(403).json({ success: false, message: "Admins cannot add products" });
    }
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      specifications,
      stockQuantity,
    } = req.body;
    const seller_id = req.userId;

    const image1 = req.files?.image1 && req.files.image1[0];
    const image2 = req.files?.image2 && req.files.image2[0];
    const image3 = req.files?.image3 && req.files.image3[0];
    const image4 = req.files?.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined,
    );

    let parsedSizes = [];
    try {
      parsedSizes = sizes ? JSON.parse(sizes) : [];
    } catch (error) {
      parsedSizes = typeof sizes === 'string' ? [sizes] : [];
    }
    
    let parsedSpecs = {};
    try {
      parsedSpecs = specifications ? JSON.parse(specifications) : {};
    } catch (error) {
      return res.status(400).json({ success: false, message: "Invalid specifications format" });
    }

    const validationError = getProductValidationError({
      name,
      description,
      price,
      category,
      subCategory,
      sizes: parsedSizes,
      images,
    });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

// sort according to predefined order
    const productData = {
      name,
      seller_id,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: parsedSizes,
      specifications: parsedSpecs,
      stockQuantity: Number(stockQuantity) || 0,
      image: imagesUrl,
      date: Date.now(),
    };
    await pool.query(
      `INSERT INTO products(
        name,
        seller_id,
        description,
        price,
        category,
        sub_category,
        bestseller,
        sizes,
        image,
        date,
        specifications,
        stock_quantity
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        productData.name,
        productData.seller_id,
        productData.description,
        productData.price,
        productData.category,
        productData.subCategory,
        productData.bestseller,
        JSON.stringify(productData.sizes),
        JSON.stringify(productData.image),
        productData.date,
        JSON.stringify(productData.specifications),
        productData.stockQuantity,
      ],
    );
    res.json({ success: true, message: "Product added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for list products
const listProducts = async (req, res) => {
  try {
    let seller_id = req.query.seller_id || null;
    const token = req.headers.authorization;

    if (token) {
      try {
        const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
        const { rows } = await pool.query(
          "SELECT role FROM users WHERE id=$1 LIMIT 1",
          [tokenDecoded.id],
        );
        if (rows[0]?.role === "seller") {
          seller_id = tokenDecoded.id;
        }
      } catch (error) {
        return res.status(401).json({ success: false, message: "not authorized login again" });
      }
    }

    let productRows ;
    if (!seller_id) {
      const result = await pool.query(
      `SELECT
        id AS "_id",
        name,
        seller_id,
        description,
        price,
        image,
        category,
        sub_category AS "subCategory",
        sizes,
        bestseller,
        date
      FROM products 
      ORDER BY date DESC`,
    );
      productRows = result.rows  
  } else{
      const result = await pool.query(
      `SELECT
        id AS "_id",
        name,
    if (!seller_id) {
      const result = await pool.query(
      `SELECT
        id AS "_id",
        name,
        seller_id,
        description,
        price,
        image,
        category,
        sub_category AS "subCategory",
        sizes,
        bestseller,
        date,
        specifications,
        stock_quantity AS "stockQuantity"
      FROM products 
      ORDER BY date DESC`,
    );
      productRows = result.rows  
  } else{
      const result = await pool.query(
      `SELECT
        id AS "_id",
        name,
        seller_id,
        description,
        price,
        image,
        category,
        sub_category AS "subCategory",
        sizes,
        bestseller,
        date,
        specifications,
        stock_quantity AS "stockQuantity"
      FROM products WHERE seller_id = $1
      ORDER BY date DESC`,
      [seller_id]
    );
      productRows = result.rows  
  }
    
    res.json({ success: true, products: productRows });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    if (req.role === 'admin') {
      return res.status(403).json({ success: false, message: "Admins cannot delete products" });
    }
    const { rowCount } = await pool.query(
      "DELETE FROM products WHERE id = $1 AND seller_id = $2",
      [req.params.id, req.userId]
    );
    if (rowCount === 0) {
      return res.status(403).json({ success: false, message: "You can only delete your own products" });
    }
    res.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const { rows } = await pool.query(
      `SELECT
        id AS "_id",
        name,
        seller_id,
        description,
        price,
        image,
        category,
        sub_category AS "subCategory",
        sizes,
        bestseller,
        date,
        specifications,
        stock_quantity AS "stockQuantity"
      FROM products
      WHERE id = $1
      LIMIT 1`,
      [productId],
    );
    res.json({ success: true, product: rows[0] });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for admin/seller product list
const adminListProducts = async (req, res) => {
  try {
    let result;
    if (req.role === 'admin') {
      result = await pool.query(
        `SELECT id AS "_id", seller_id, name, description, price, image, category, sub_category AS "subCategory", sizes, bestseller, date, specifications, stock_quantity AS "stockQuantity"
         FROM products ORDER BY date DESC`
      );
    } else {
      result = await pool.query(
        `SELECT id AS "_id", seller_id, name, description, price, image, category, sub_category AS "subCategory", sizes, bestseller, date, specifications, stock_quantity AS "stockQuantity"
         FROM products WHERE seller_id = $1 ORDER BY date DESC`,
        [req.userId]
      );
    }
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { listProducts, addProduct, removeProduct, singleProduct, adminListProducts };
