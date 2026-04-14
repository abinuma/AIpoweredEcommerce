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
