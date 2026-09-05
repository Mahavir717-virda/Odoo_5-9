const express = require("express");

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth");
const employeeRoutes = require("./employees");
const contractRoutes = require("./contracts");
const attendanceRoutes = require("./attendance");

const router = express.Router();

// Health routes
router.use("/", healthRoutes);

// Auth routes
router.use("/auth", authRoutes);

// Employee routes
router.use("/employees", employeeRoutes);

// Contract routes
router.use("/contracts", contractRoutes);

// Attendance routes
router.use("/attendance", attendanceRoutes);

module.exports = router;