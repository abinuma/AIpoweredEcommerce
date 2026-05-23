import { pool } from "../config/postgres.js";

const sellerRequest = async (req,res) => {
    try {
        const {shop_name,shop_description,business_detail,latitude,longitude} = req.body;
        const user_id = req.userId || req.body.user_id;

        if (!shop_name?.trim()) {
            return res.status(400).json({ success: false, message: "Shop name is required" });
        }
        if (!shop_description?.trim()) {
            return res.status(400).json({ success: false, message: "Shop description is required" });
        }
        if (!business_detail?.trim()) {
            return res.status(400).json({ success: false, message: "Business details are required" });
        }

        const { rows: userRows } = await pool.query(
            "SELECT role FROM users WHERE id=$1 LIMIT 1",
            [user_id]
        );
        if (userRows[0]?.role === "seller") {
            return res.status(400).json({ success: false, message: "You are already a seller." });
        }

        // Check for existing pending request
        const { rows: existing } = await pool.query(
            "SELECT id FROM sellerRequest WHERE user_id=$1 AND status='pending' LIMIT 1",
            [user_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Your seller request is pending approval." });
        }

        const lat = latitude != null && latitude !== "" ? Number(latitude) : null;
        const lng = longitude != null && longitude !== "" ? Number(longitude) : null;

        await pool.query(
            "INSERT INTO sellerRequest (user_id,shop_name,shop_description,business_detail,latitude,longitude,date) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING * ",
            [user_id, shop_name.trim(), shop_description.trim(), business_detail.trim(), lat, lng, Date.now()]
        )
        res.status(200).json({success:true,message:"Request sent successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
    
}

const checkRequestStatus = async (req, res) => {
    try {
        const user_id = req.userId || req.body.user_id;
        const { rows } = await pool.query(
            "SELECT status FROM sellerRequest WHERE user_id=$1 ORDER BY date DESC LIMIT 1",
            [user_id]
        );
        if (rows.length > 0) {
            res.status(200).json({ success: true, status: rows[0].status });
        } else {
            res.status(200).json({ success: true, status: null });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSellerRequest = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        sr.*,
        u.email
      FROM sellerRequest sr
      LEFT JOIN users u
      ON sr.user_id = u.id
      ORDER BY sr.date DESC
    `);

    const formattedRows = rows.map((req) => ({
      ...req,

      // distance_km:
      //   req.latitude && req.longitude
      //     ? "Location provided"
      //     : null,
    }));

    res.status(200).json({
      success: true,
      requests: formattedRows,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifySellerRequest = async (req,res) => {
    try {
        const {id,status}  = req.body
        if(status === "approved"){
            const {rows} = await pool.query(
                "SELECT user_id, shop_name, latitude, longitude FROM sellerRequest WHERE id=$1",
                [id]
            )
            const requestData = rows[0]
            await pool.query(
                "UPDATE users SET role='seller', shop_name=$1, latitude=$2, longitude=$3 WHERE id=$4",
                [requestData.shop_name, requestData.latitude, requestData.longitude, requestData.user_id]
            )
        }
        await pool.query(
            "UPDATE sellerRequest SET status=$1 WHERE id=$2",
            [status,id]
        )
        res.status(200).json({success:true, message:"status updated successfully" })

    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:error.message})
    }
}


export {sellerRequest,verifySellerRequest,getSellerRequest,checkRequestStatus}