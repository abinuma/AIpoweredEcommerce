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

    // Check if it's the admin from ENV
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        let { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        let adminUser = rows[0];
        
        if (!adminUser) {
             const salt = await bcrypt.genSalt(10);
             const hashedPassword = await bcrypt.hash(password, salt);
             const result = await pool.query(
                 "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin') RETURNING *",
                 ['Admin', email, hashedPassword]
             );
             adminUser = result.rows[0];
        } else if (adminUser.role !== 'admin') {
             await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminUser.id]);
             adminUser.role = 'admin';
        }
        
        const token = createToken(adminUser.id);
        return res.json({ success: true, token, role: 'admin' });
    }

    const { rows } = await pool.query(
      "SELECT id, password, role FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    const user = rows[0];
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user.id);
      res.json({ success: true, token, role: user.role });
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
    const { name, email, password } = req.body;
    const role = email=== process.env.ADMIN_EMAIL? 'admin' : 'client'

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

    res.json({ success: true, token, role });
    console.log('role is:' + role +' \n email is:' + email)
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Auto-create/verify hardcoded admin from ENV
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        let { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        let adminUser = rows[0];
        
        if (!adminUser) {
             const salt = await bcrypt.genSalt(10);
             const hashedPassword = await bcrypt.hash(password, salt);
             const result = await pool.query(
                 "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin') RETURNING *",
                 ['Admin', email, hashedPassword]
             );
             adminUser = result.rows[0];
        } else if (adminUser.role !== 'admin') {
             await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminUser.id]);
             adminUser.role = 'admin';
        }
        
        const token = createToken(adminUser.id);
        return res.status(200).json({ success: true, token });
    }

    const { rows } = await pool.query(
      "SELECT id, password, role FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    const user = rows[0];
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.role !== 'admin' && user.role !== 'seller') {
      return res.status(403).json({ success: false, message: "Not authorized as admin or seller" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user.id);
      res.status(200).json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin };


