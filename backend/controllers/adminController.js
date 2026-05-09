import { pool } from "../config/postgres.js";

const getAllUsers = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const role = req.query.role;

        let query, countQuery, params, countParams;

        if (role) {
            query = "SELECT id,name,email,role,suspended FROM users WHERE role=$1 ORDER BY name ASC LIMIT $2 OFFSET $3";
            params = [role, limit, offset];
            countQuery = "SELECT COUNT(*) FROM users WHERE role=$1";
            countParams = [role];
        } else {
            query = "SELECT id,name,email,role,suspended FROM users ORDER BY name ASC LIMIT $1 OFFSET $2";
            params = [limit, offset];
            countQuery = "SELECT COUNT(*) FROM users";
            countParams = [];
        }

        const { rows } = await pool.query(query, params);
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);

        res.status(200).json({
            success: true,
            message: "all users fetched successfully",
            users: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}
const getUserById = async (req,res) => {
    try {
        
    const {rows} = await pool.query(
            "SELECT id,name,email,role FROM users WHERE ID=$1 LIMIT 1 ",
            [req.params.id]
        )
        if(rows.length === 0){
            return res.status(404).json({success:false,message:"user not found"})
        }
        res.status(200).json({success:true,user:rows[0]})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}
const updateUserRole = async (req,res) => {
    try {
        const {id, role} = req.body;

        const validRoles = ['client', 'seller', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}`});
        }

        if (role === 'client') {
            // Downgrading to client — clear seller-specific fields
            await pool.query(
                "UPDATE users SET role=$1, shop_name=NULL, latitude=NULL, longitude=NULL WHERE id=$2",
                [role, id]
            );
        } else {
            await pool.query(
                "UPDATE users SET role=$1 WHERE id=$2",
                [role, id]
            );
        }

        res.status(200).json({success: true, message: "role updated successfully"});
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}
const suspendUser = async (req,res) => {
    try {
        const id  = req.params.id;
        await pool.query(
            "UPDATE users SET suspended=true WHERE id=$1",
            [id]
        )
        res.status(200).json({success:true, message:"user suspeneded" })
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
    
}
const deleteUser = async (req,res) => {
    try {
        const id = req.params.id;
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [id]
        )
        res.status(200).json({success:true,message:"user deleted successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}
const getAllProducts  = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { rows } = await pool.query(
            "SELECT p.*, u.name as seller_name, u.shop_name as seller_shop FROM products p JOIN users u ON p.seller_id = u.id ORDER BY p.date DESC LIMIT $1 OFFSET $2",
            [limit, offset]
        );
        const { rows: countRows } = await pool.query("SELECT COUNT(*) FROM products");
        const total = parseInt(countRows[0].count);

        res.status(200).json({
            success: true,
            products: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}
const removeProductAdmin = async (req,res) => {
    try {
        const id = req.params.id;
        await pool.query(
            "DELETE FROM products WHERE id = $1",
            [id]
        )
        res.status(200).json({success:true,message:"product deleted successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}
const getPlatformAnalytics = async (req,res) => {
    try {
        const thirtyDaysAgoMs = Date.now() - (30 * 24 * 60 * 60 * 1000);

        const [totalClients, totalSellers, totalProducts, totalOrders, pendingOrders, shippedOrders, deliveredOrders, totalRevenue, ordersThisMonth, unpaidOrders, pendingSellerRequests] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM users WHERE role = 'client'"),
            pool.query("SELECT COUNT(*) FROM users WHERE role = 'seller'"),
            pool.query("SELECT COUNT(*) FROM products"),
            pool.query("SELECT COUNT(*) FROM orders"),
            pool.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'"),
            pool.query("SELECT COUNT(*) FROM orders WHERE status = 'shipped'"),
            pool.query("SELECT COUNT(*) FROM orders WHERE status = 'delivered'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) AS sum FROM orders WHERE payment = true"),
            pool.query("SELECT COUNT(*) FROM orders WHERE date > $1", [thirtyDaysAgoMs]),
            pool.query("SELECT COUNT(*) FROM orders WHERE payment = false"),
            pool.query("SELECT COUNT(*) FROM sellerRequest WHERE status = 'pending'")
        ]);
        res.status(200).json({
            success: true,
            totalClients: totalClients.rows[0].count,
            totalSellers: totalSellers.rows[0].count,
            totalProducts: totalProducts.rows[0].count,
            totalOrders: totalOrders.rows[0].count,
            pendingOrders: pendingOrders.rows[0].count,
            shippedOrders: shippedOrders.rows[0].count,
            deliveredOrders: deliveredOrders.rows[0].count,
            totalRevenue: totalRevenue.rows[0].sum,
            ordersThisMonth: ordersThisMonth.rows[0].count,
            unpaidOrders: unpaidOrders.rows[0].count,
            pendingSellerRequests: pendingSellerRequests.rows[0].count
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}

export {getAllUsers,getUserById,updateUserRole,suspendUser,deleteUser,getAllProducts,removeProductAdmin,getPlatformAnalytics}