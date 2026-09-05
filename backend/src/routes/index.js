import express from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.js";
import employeeRoutes from "./employees.js";
import contractRoutes from "./contracts.js";
import attendanceRoutes from "./attendance.js";
import timeOffRoutes from "./timeOff.js";

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

// Time Off routes (/api/v1/time-off)
router.use("/time-off", timeOffRoutes);

export default router;
