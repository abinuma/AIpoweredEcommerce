import { pool } from "../config/postgres.js";
import Stripe from "stripe";


//global variables
const currency = 'USD';
const deliveryCharge = 10;


//gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getItemProductId = (item) => item._id || item.id || item.productId;

const getSellerOrderGroups = async (items, amount) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Order must include at least one product");
    }

    const productIds = [...new Set(items.map(getItemProductId).filter(Boolean))];
    if (productIds.length !== items.length && productIds.length === 0) {
        throw new Error("Order items must include product ids");
    }

    const { rows: products } = await pool.query(
        "SELECT id, seller_id, price FROM products WHERE id = ANY($1::uuid[])",
        [productIds]
    );
    const productById = new Map(products.map((product) => [String(product.id), product]));
    const groupsBySeller = new Map();
    let subtotal = 0;

    for (const item of items) {
        const productId = getItemProductId(item);
        const product = productById.get(String(productId));
        if (!product) {
            throw new Error(`Product not found for order item: ${productId}`);
        }
        if (!product.seller_id) {
            throw new Error(`Product has no seller owner: ${productId}`);
        }

        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.price ?? product.price) || 0;
        const itemTotal = unitPrice * quantity;
        subtotal += itemTotal;

        const sellerId = String(product.seller_id);
        if (!groupsBySeller.has(sellerId)) {
            groupsBySeller.set(sellerId, { sellerId, items: [], subtotal: 0 });
        }

        const group = groupsBySeller.get(sellerId);
        group.items.push({ ...item, seller_id: sellerId });
        group.subtotal += itemTotal;
    }

    const deliveryTotal = Math.max((Number(amount) || 0) - subtotal, 0);
    const totalAmount = Number(amount) || subtotal + deliveryTotal;
    const groups = Array.from(groupsBySeller.values());
    let allocatedAmount = 0;

    return groups.map((group, index) => {
        const deliveryShare =
            deliveryTotal > 0
                ? subtotal > 0
                    ? deliveryTotal * (group.subtotal / subtotal)
                    : deliveryTotal / groups.length
                : 0;
        const groupAmount =
            index === groups.length - 1
                ? Number((totalAmount - allocatedAmount).toFixed(2))
                : Number((group.subtotal + deliveryShare).toFixed(2));
        allocatedAmount += groupAmount;

        return {
            sellerId: group.sellerId,
            items: group.items,
            amount: groupAmount,
        };
    });
};

const insertSellerOrders = async ({ userId, groups, address, paymentMethod, payment }) => {
    const orderIds = [];

    for (const group of groups) {
        const { rows: inserted } = await pool.query(
          `INSERT INTO orders(
            user_id,
            seller_id,
            items,
            address,
            amount,
            payment_method,
            payment,
            date
          ) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [
            userId,
            group.sellerId,
            JSON.stringify(group.items),
            JSON.stringify(address),
            group.amount,
            paymentMethod,
            payment,
            Date.now(),
          ],
        );
        orderIds.push(inserted[0].id);
    }

    return orderIds;
};

// placing orders using COD method
const placeOrder = async (req,res) => {
    try {
        const userId = req.userId;
        const {items, amount, address} = req.body;

        const groups = await getSellerOrderGroups(items, amount);
        await insertSellerOrders({
            userId,
            groups,
            address,
            paymentMethod: "COD",
            payment: false,
        });

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

        const groups = await getSellerOrderGroups(items, amount);
        const orderIds = await insertSellerOrders({
            userId,
            groups,
            address,
            paymentMethod: "Stripe",
            payment: false,
        });

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
            success_url: `${origin}/verify?success=true&orderId=${orderIds.join(",")}`,
            cancel_url: `${origin}/verify?success=false&orderId=${orderIds.join(",")}`,
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
        const orderIds = String(orderId || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (orderIds.length === 0) {
            return res.json({success: false, message: "Order id is required"});
        }

        if (success === "true") {
            await pool.query(
              "UPDATE orders SET payment = true WHERE id = ANY($1::uuid[]) AND user_id = $2",
              [orderIds, userId],
            );
            await pool.query(
              "UPDATE users SET cart_data = '{}'::jsonb WHERE id = $1",
              [userId],
            );
            res.json({success: true});
        } else{
            await pool.query(
              "DELETE FROM orders WHERE id = ANY($1::uuid[]) AND user_id = $2",
              [orderIds, userId],
            );
            res.json({success: false})
        }
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//placing orders using razorpay method
const placeOrderRazorpay = async (req,res) =>{
    try {
        res.status(501).json({ success: false, message: "Razorpay is not yet implemented" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// All orders data for admin panel — includes seller/shop info for admin analytics
const allOrders = async (req,res) => {
    try {
        let ordersRows;
        if (req.role === 'admin') {
            const { rows } = await pool.query(
              `SELECT
                o.id AS "_id",
                o.items,
                o.amount,
                o.address,
                o.status,
                o.payment_method AS "paymentMethod",
                o.payment,
                o.date,
                o.seller_id,
                u.shop_name AS "shopName",
                u.name AS "sellerName"
              FROM orders o
              LEFT JOIN users u ON o.seller_id = u.id
              ORDER BY o.date DESC`
            );
            ordersRows = rows;
        } else {
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
              WHERE seller_id = $1
              ORDER BY date DESC`,
              [req.userId]
            );
            ordersRows = rows;
        }
        res.json({success: true, orders: ordersRows})
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
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// update order status — SELLERS ONLY for their own orders
const updateStatus = async (req,res) => {
    try {
        const {orderId, status} = req.body;
        if (req.role === 'admin') {
            return res.status(403).json({ success: false, message: "Admins cannot update order status. Only sellers can." });
        }
        const { rowCount } = await pool.query(
          "UPDATE orders SET status = $2 WHERE id = $1 AND seller_id = $3",
          [orderId, status, req.userId],
        );
        if (rowCount === 0) {
            return res.status(403).json({ success: false, message: "You can only update orders for your own shop" });
        }
        res.json({success: true, message: 'Status Updated'})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

export {verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus}
