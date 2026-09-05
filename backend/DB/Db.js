import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "odoo_5-9",
  password: process.env.PGPASSWORD || "mahavir7107",
  port: Number(process.env.PGPORT) || 5432,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected successfully!");
    
    // Auto-create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        refresh_token TEXT,
        access_token TEXT,
        otp VARCHAR(10),
        otp_expiry TIMESTAMP WITH TIME ZONE,
        is_otp_verified BOOLEAN DEFAULT FALSE,
        googleid VARCHAR(255),
        auth_provider VARCHAR(50) DEFAULT 'local',
        avatar TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
};

export default connectDB;