import { pool } from "../DB/Db.js";

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected successfully!");
    console.log("Current Time:", result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

testConnection();