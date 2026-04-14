import { v2 as cloudinary } from "cloudinary";
import { pool } from "../config/postgres.js";
// function for add product

const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined,
    );

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

    const sizeOrder = [ "S", "M", "L", "XL", "XXL"];

// parse sizes
let parsedSizes = JSON.parse(sizes);

// sort according to predefined order
parsedSizes.sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: parsedSizes, // ✅ sorted sizes
 //used to convert stringified array back to actual array(because Data coming from req.body is ALWAYS a string)
      image: imagesUrl,
      date: Date.now(),
    };
    console.log(productData);

    await pool.query(
      `INSERT INTO products(
        name,
        description,
        price,
        category,
        sub_category,
        bestseller,
        sizes,
        image,
        date
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.subCategory,
        productData.bestseller,
        JSON.stringify(productData.sizes),
        JSON.stringify(productData.image),
        productData.date,
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
    const { rows } = await pool.query(
      `SELECT
        id AS "_id",
        name,
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
    res.json({ success: true, products: rows });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
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
        description,
        price,
        image,
        category,
        sub_category AS "subCategory",
        sizes,
        bestseller,
        date
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

export { listProducts, addProduct, removeProduct, singleProduct };

