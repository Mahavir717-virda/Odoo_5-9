import express from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import employeeRoutes from "./employees.routes.js";
import contractRoutes from "./contracts.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import salaryRulesRoutes from "./salaryRules.routes.js";
import salaryStructuresRoutes from "./salaryStructures.routes.js";
import payrunRoutes from "./payruns.routes.js";
import payslipRoutes from "./payslips.routes.js";
import timeOffRoutes from "./timeOff.routes.js";
import reportRoutes from "./reports.routes.js";
import workingScheduleRoutes from "./workingSchedules.routes.js";
import notificationRoutes from "./notifications.routes.js";
import calendarRoutes from "./calendar.routes.js";

const router = express.Router();

// Health routes
router.use("/", healthRoutes);

// Auth routes
router.use("/auth", authRoutes);

// Employee routes
router.use("/employees", employeeRoutes);

// Working Schedule routes (/api/v1/working-schedules)
router.use("/working-schedules", workingScheduleRoutes);

// Contract routes
router.use("/contracts", contractRoutes);

// Attendance routes
router.use("/attendance", attendanceRoutes);

// Calendar routes (/api/v1/calendar)
router.use("/calendar", calendarRoutes);

// Salary Rule routes (/api/v1/salary-rules)
router.use("/salary-rules", salaryRulesRoutes);

// Salary Structure routes (/api/v1/salary-structures)
router.use("/salary-structures", salaryStructuresRoutes);

// Payrun routes (/api/v1/payruns)
router.use("/payruns", payrunRoutes);

// Payslip routes (/api/v1/payslips)
router.use("/payslips", payslipRoutes);

// Time Off routes (/api/v1/time-off)
router.use("/time-off", timeOffRoutes);

// Reports routes (/api/v1/reports)
router.use("/reports", reportRoutes);

// Notifications routes (/api/v1/notifications)
router.use("/notifications", notificationRoutes);

export default router;
