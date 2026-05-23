import { Pool, types } from "pg";

// Parse BIGINT (int8) as integer (OID for BIGINT is 20)
types.setTypeParser(20, (val) => parseInt(val, 10));


const connectionString = process.env.POSTGRES_URI;

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
      suspended boolean NOT NULL DEFAULT false,
      email text NOT NULL UNIQUE,
      role text NOT NULL DEFAULT 'client' CHECK (role IN ('client','seller','admin')) ,
      password text NOT NULL,
      shop_name text,
      latitude double precision,
      longitude double precision,
      cart_data jsonb NOT NULL DEFAULT '{}'::jsonb
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
    ALTER TABLE users ALTER COLUMN latitude TYPE double precision USING latitude::double precision;
    ALTER TABLE users ALTER COLUMN longitude TYPE double precision USING longitude::double precision;

    CREATE TABLE IF NOT EXISTS products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      seller_id uuid  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      description text NOT NULL,
      price double precision NOT NULL,
      image jsonb NOT NULL,
      category text NOT NULL,
      sub_category text NOT NULL,
      sizes jsonb NOT NULL,
      bestseller boolean,
      date bigint NOT NULL
    );
    ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS restricted boolean NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS chat_sessions(
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at bigint NOT NULL,
        updated_at bigint NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role text NOT NULL CHECK (role IN ('user', 'assistant')),
        message text NOT NULL,
        created_at bigint NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      items jsonb NOT NULL,
      seller_id uuid REFERENCES users(id) ON DELETE SET NULL,
      amount double precision NOT NULL,
      address jsonb NOT NULL,
      status text NOT NULL DEFAULT 'Order Placed',
      payment_method text NOT NULL,
      payment boolean NOT NULL DEFAULT false,
      date bigint NOT NULL
    );
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES users(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment text,
      date bigint NOT NULL,
      UNIQUE(product_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS review_summaries (
      product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      summary text,
      pros jsonb,
      cons jsonb,
      review_count integer NOT NULL DEFAULT 0,
      updated_at bigint NOT NULL
    );
    ALTER TABLE review_summaries ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;
    ALTER TABLE review_summaries ADD COLUMN IF NOT EXISTS draft_summary text;
    ALTER TABLE review_summaries ADD COLUMN IF NOT EXISTS draft_pros jsonb;
    ALTER TABLE review_summaries ADD COLUMN IF NOT EXISTS draft_cons jsonb;

    CREATE TABLE IF NOT EXISTS sellerRequest(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shop_name text NOT NULL,
      business_detail text,
      latitude double precision NOT NULL,
      longitude double precision NOT NULL,
      status text NOT NULL DEFAULT 'pending' CHECK( status IN ('pending' ,'approved' , 'rejected')),
      date bigint NOT NULL
    );
    ALTER TABLE sellerRequest ADD COLUMN IF NOT EXISTS shop_description VARCHAR(30);
    ALTER TABLE sellerRequest ALTER COLUMN latitude DROP NOT NULL;
    ALTER TABLE sellerRequest ALTER COLUMN longitude DROP NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
    CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_seller_location ON users(latitude, longitude) WHERE role = 'seller';
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
  `);

  console.log("Postgres DB Connected");
};

export default connectDB;
