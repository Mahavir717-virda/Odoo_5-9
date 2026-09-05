import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/v1/health
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "PeoplePay360 API is running",
  });
});

// GET /api/v1/health/db
router.get("/health/db", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW()");
    return res.status(200).json({
      success: true,
      message: "Database is healthy and connected",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

export default router;
