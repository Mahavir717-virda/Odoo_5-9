const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth");

const router = express.Router();

// Health routes (/api/v1/health, /api/v1/health/db)
router.use("/", healthRoutes);

// Auth routes (/api/v1/auth/login, /api/v1/auth/me, /api/v1/auth/*-test)
router.use("/auth", authRoutes);

module.exports = router;
