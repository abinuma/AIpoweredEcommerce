// --- cartController.js ---
import { pool } from "../config/postgres.js";

// add products to user cart
const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    // const {userId,  itemId, size } = req.body;
    const { itemId, size } = req.body;

    const { rows } = await pool.query(
      "SELECT cart_data FROM users WHERE id = $1 LIMIT 1",
      [userId],
    );
    const userData = rows[0];
    let cartData = (userData && userData.cart_data) || {};

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    await pool.query(
      "UPDATE users SET cart_data = $2 WHERE id = $1",
      [userId, JSON.stringify(cartData)],
    );

    res.json({ success: true, message: "added to cart " });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//update user cart
const updateCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId, size, quantity } = req.body;

    const { rows } = await pool.query(
      "SELECT cart_data FROM users WHERE id = $1 LIMIT 1",
      [userId],
    );
    const userData = rows[0];
    let cartData = (userData && userData.cart_data) || {};

    cartData[itemId] = cartData[itemId] || {};
    cartData[itemId][size] = quantity;

    await pool.query(
      "UPDATE users SET cart_data = $2 WHERE id = $1",
      [userId, JSON.stringify(cartData)],
    );

    res.json({ success: true, message: "Cart updated " });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//get user cart
const getUserCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT cart_data FROM users WHERE id = $1 LIMIT 1",
      [userId],
    );
    let cartData = (rows[0] && rows[0].cart_data) || {};

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };

// --- orderController.js ---
import { pool } from "../config/postgres.js";
import Stripe from "stripe";


//global variables
const currency = 'USD';
const deliveryCharge = 10;


//getway intialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// placing orders using COD method

const placeOrder = async (req,res) => {
    try {
        const userId = req.userId;
        const {items, amount, address} = req.body;

        await pool.query(
          `INSERT INTO orders(
            user_id,
            items,
            address,
            amount,
            payment_method,
            payment,
            date
          ) VALUES($1,$2,$3,$4,$5,$6,$7)`,
          [
            userId,
            JSON.stringify(items),
            JSON.stringify(address),
            amount,
            "COD",
            false,
            Date.now(),
          ],
        );

        await pool.query(
          "UPDATE users SET cart_data = '{}'::jsonb WHERE id = $1",
          [userId],
        );
        res.json({success: true, message: 'Order Placed'})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}
// placing orders using stripe method

const placeOrderStripe = async (req,res) => {
    try {
        const userId = req.userId;
        const {items, amount, address} = req.body;
        const {origin} = req.headers;

        const { rows: inserted } = await pool.query(
          `INSERT INTO orders(
            user_id,
            items,
            address,
            amount,
            payment_method,
            payment,
            date
          ) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [
            userId,
            JSON.stringify(items),
            JSON.stringify(address),
            amount,
            "Stripe",
            false,
            Date.now(),
          ],
        );
        const orderId = inserted[0].id;

        const line_items = items.map((item)=>({
            price_data : {
                currency: currency,
                product_data: {
                    name: item.name,

                },  
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data : {
                currency: currency,
                product_data: {
                    name: "Delivery Charges",
                },  
                unit_amount: Math.round(deliveryCharge * 100)
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${orderId}`,
            cancel_url: `${origin}/verify?success=false&orderId=${orderId}`,
            line_items,
            mode: 'payment'
        })

        res.json({success: true, session_url: session.url})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//verify stripe

const verifyStripe = async (req,res) => {
    const userId = req.userId;
    const {success, orderId} = req.body;
    try {
        if (success === "true") {
            await pool.query(
              "UPDATE orders SET payment = true WHERE id = $1 AND user_id = $2",
              [orderId, userId],
            );
            await pool.query(
              "UPDATE users SET cart_data = '{}'::jsonb WHERE id = $1",
              [userId],
            );
            res.json({success: true});
        } else{
            await pool.query(
              "DELETE FROM orders WHERE id = $1 AND user_id = $2",
              [orderId, userId],
            );
            res.json({success: false})
        }
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//placing orders using razorpay method

const placeOrderRazorpay = async (req,res) => {
    try {
        
    } catch (error) {
        
    }
}

// All orders data for admin panel
const allOrders = async (req,res) => {
    try {
        const { rows } = await pool.query(
          `SELECT
            id AS "_id",
            items,
            amount,
            address,
            status,
            payment_method AS "paymentMethod",
            payment,
            date
          FROM orders
          ORDER BY date DESC`,
        );
        res.json({success: true, orders: rows})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}
// user order data for frontend
const userOrders = async (req,res) => {
    try {
        const userId = req.userId;
        const { rows } = await pool.query(
          `SELECT
            id AS "_id",
            items,
            amount,
            address,
            status,
            payment_method AS "paymentMethod",
            payment,
            date
          FROM orders
          WHERE user_id = $1
          ORDER BY date DESC`,
          [userId],
        );
        res.json({success: true, orders: rows})
        // console.log(orders)
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//update order status from admin panel
const updateStatus = async (req,res) => {
    try {
        const {orderId, status} = req.body;
        await pool.query(
          "UPDATE orders SET status = $2 WHERE id = $1",
          [orderId, status],
        );
        res.json({success: true, message: 'Status Updated'})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

export {verifyStripe,placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus}

// --- productController.js ---
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

// --- userController.js ---
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/postgres.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

//Route for user logic
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      "SELECT id, password FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    const user = rows[0];
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user.id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Route for user registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password,role } = req.body;

    //checking user already exist or not
    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    if (existing.length > 0) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email and strong password

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }
    if (password.length < 4) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    //hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { rows } = await pool.query(
      "INSERT INTO users(name, email,role, password) VALUES($1, $2, $3,$4) RETURNING id",
      [name, email,role, hashedPassword],
    );

    const token = createToken(rows[0].id);

    res.json({ success: true, token });
    console.log('role is:' + role +' \n email is:\n' + email)
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin };
