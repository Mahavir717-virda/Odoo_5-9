import express from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.js";
const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth");
const employeeRoutes = require("./employees");

const router = express.Router();

// Health routes (/api/v1/health, /api/v1/health/db)
router.use("/", healthRoutes);

// Auth routes (/api/v1/auth/login, /api/v1/auth/me, /api/v1/auth/*-test)
router.use("/auth", authRoutes);

export default router;
// Employee routes (/api/v1/employees)
router.use("/employees", employeeRoutes);

module.exports = router;
