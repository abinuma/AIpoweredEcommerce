// --- cloudinary.js ---
import {v2 as cloudinary} from 'cloudinary';

const connectCloudinary = async () => {
    cloudinary.config({
        cloud_name : process.env.CLOUDINARY_NAME,
        api_key : process.env.CLOUDINARY_API_KEY,
        api_secret : process.env.CLOUDINARY_SECRET_KEY
    })
}

export default connectCloudinary;

// --- mongodb.js ---
import mongoose from 'mongoose';

const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log('DB Connected')
    })
    await mongoose.connect(`${process.env.MONGODB_URI}/ecommerce` )
}

export default connectDB;

// --- postgres.js ---
import { Pool, types } from "pg";

// Parse BIGINT (int8) as integer (OID for BIGINT is 20)
types.setTypeParser(20, (val) => parseInt(val, 10));


const connectionString = process.env.POSTGRES_URI || process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl:
    process.env.POSTGRES_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

const connectDB = async () => {
  if (!connectionString) {
    throw new Error("Missing POSTGRES_URI (or DATABASE_URL) in environment");
  }

  // Create schema on startup (dev-friendly). You can replace this with migrations later.
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      role text NOT NULL DEFAULT 'client',
      password text NOT NULL,
      cart_data jsonb NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text NOT NULL,
      price double precision NOT NULL,
      image jsonb NOT NULL,
      category text NOT NULL,
      sub_category text NOT NULL,
      sizes jsonb NOT NULL,
      bestseller boolean,
      date bigint NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      items jsonb NOT NULL,
      amount double precision NOT NULL,
      address jsonb NOT NULL,
      status text NOT NULL DEFAULT 'Order Placed',
      payment_method text NOT NULL,
      payment boolean NOT NULL DEFAULT false,
      date bigint NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  `);

  console.log("Postgres DB Connected");
};

export default connectDB;
