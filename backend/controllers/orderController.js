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

