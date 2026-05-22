import { pool } from "../config/postgres.js";

const sellerRequest = async (req,res) => {
    try {
        const {shop_name,shop_description,business_detail,latitude,longitude} = req.body;
        const user_id = req.userId || req.body.user_id;
        await pool.query(
            "INSERT INTO sellerRequest (user_id,shop_name,shop_description,business_detail,latitude,longitude,date) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING * ",
            [user_id,shop_name,shop_description,business_detail,latitude,longitude,Date.now()]
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