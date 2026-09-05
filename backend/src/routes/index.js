import express from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.js";
import employeeRoutes from "./employees.js";
import contractRoutes from "./contracts.js";

const router = express.Router();

// Health routes (/api/v1/health, /api/v1/health/db)
router.use("/", healthRoutes);

// Auth routes (/api/v1/auth/login, /api/v1/auth/me, /api/v1/auth/*-test)
router.use("/auth", authRoutes);

// Employee routes (/api/v1/employees)
router.use("/employees", employeeRoutes);

// Contract routes (/api/v1/contracts)
router.use("/contracts", contractRoutes);

export default router;