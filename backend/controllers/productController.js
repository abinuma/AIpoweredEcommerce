import { v2 as cloudinary } from "cloudinary";
import { pool } from "../config/postgres.js";
import jwt from "jsonwebtoken";

const CATEGORIES_WITH_SIZES = {
  Clothing: ["S", "M", "L", "XL", "XXL"],
  Shoes: ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
};

const SPEC_REQUIREMENTS = {
  Clothing: { fields: ["Audience"] },
  Shoes: { fields: ["brand", "Audience", "color"] },
  Beauty: { fields: ["skinType", "ingredients", "expiryDate", "brand"] },
};

const parseSizesInput = (sizes) => {
  if (sizes == null || sizes === "") return [];
  if (Array.isArray(sizes)) return sizes;
  if (typeof sizes === "string") {
    try {
      const parsed = JSON.parse(sizes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeSizeEntries = (sizes) => {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((entry) => {
      if (typeof entry === "string") {
        return { size: entry.trim(), stock: 0 };
      }
      if (entry && typeof entry === "object" && entry.size != null) {
        return {
          size: String(entry.size).trim(),
          stock: Number(entry.stock) || 0,
        };
      }
      return null;
    })
    .filter((entry) => entry && entry.size);
};

// function for add product
const getProductValidationError = ({
  name,
  description,
  price,
  category,
  subCategory,
  sizes,
  images,
  specifications,
}) => {
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
    return "Sizes must be a valid list";
  }
  if (CATEGORIES_WITH_SIZES[category] && sizes.length === 0) {
    return "Select at least one product size";
  }
  if (CATEGORIES_WITH_SIZES[category]) {
    const allowed = CATEGORIES_WITH_SIZES[category];
    for (const entry of sizes) {
      const label = typeof entry === "string" ? entry : entry?.size;
      if (!label || !allowed.includes(String(label))) {
        return `Invalid size "${label || ""}" for ${category}`;
      }
    }
  }
  const specRule = SPEC_REQUIREMENTS[category];
  if (specRule?.fields) {
    for (const field of specRule.fields) {
      const value = specifications?.[field];
      if (value === undefined || value === null || String(value).trim() === "") {
        const label = field === "Audience" ? "Audience" : field;
        return `${label} is required`;
      }
    }
  }
  if (!Array.isArray(images) || images.length === 0) {
    return "Upload at least one product image";
  }
  return null;
};

const addProduct = async (req, res) => {
  try {
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

    const parsedSizes = normalizeSizeEntries(parseSizesInput(sizes));

    let parsedSpecs = {};
    try {
      parsedSpecs = specifications ? JSON.parse(specifications) : {};
      if (parsedSpecs === null || typeof parsedSpecs !== "object" || Array.isArray(parsedSpecs)) {
        return res.status(400).json({ success: false, message: "Invalid specifications format" });
      }
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
      specifications: parsedSpecs,
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
    res.status(500).json({ success: false, message: error.message || "Failed to add product" });
  }
};

// function for list products (customer-facing — excludes restricted products)
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
        // token invalid — just proceed without seller filter
      }
    }

    let productRows;
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
        WHERE restricted = false
        ORDER BY date DESC`,
      );
      productRows = result.rows;
    } else {
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
      productRows = result.rows;
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
        stock_quantity AS "stockQuantity",
        restricted
      FROM products
      WHERE id = $1
      LIMIT 1`,
      [productId],
    );
    const product = rows[0];
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.restricted) {
      let canView = false;
      const token = req.headers.authorization;
      if (token) {
        try {
          const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
          const { rows: userRows } = await pool.query(
            "SELECT role FROM users WHERE id=$1 LIMIT 1",
            [tokenDecoded.id],
          );
          const role = userRows[0]?.role;
          canView =
            role === "admin" ||
            (role === "seller" && product.seller_id === tokenDecoded.id);
        } catch {
          canView = false;
        }
      }
      if (!canView) {
        return res.status(404).json({ success: false, message: "Product not available" });
      }
    }

    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// function for admin/seller product list (includes restricted products with status)
const adminListProducts = async (req, res) => {
  try {
    let result;
    if (req.role === 'admin') {
      result = await pool.query(
        `SELECT p.id AS "_id", p.seller_id, p.name, p.description, p.price, p.image, p.category,
                p.sub_category AS "subCategory", p.sizes, p.bestseller, p.date, p.specifications,
                p.stock_quantity AS "stockQuantity", p.restricted,
                u.shop_name AS "shopName", u.name AS "sellerName"
         FROM products p
         LEFT JOIN users u ON p.seller_id = u.id
         ORDER BY p.date DESC`
      );
    } else {
      result = await pool.query(
        `SELECT id AS "_id", seller_id, name, description, price, image, category,
                sub_category AS "subCategory", sizes, bestseller, date, specifications,
                stock_quantity AS "stockQuantity", restricted
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

// Restrict a product (admin only)
const restrictProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE products SET restricted = true WHERE id = $1", [id]);
    res.json({ success: true, message: "Product restricted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Unrestrict a product (admin only)
const unrestrictProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE products SET restricted = false WHERE id = $1", [id]);
    res.json({ success: true, message: "Product unrestricted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { listProducts, addProduct, removeProduct, singleProduct, adminListProducts, restrictProduct, unrestrictProduct };
