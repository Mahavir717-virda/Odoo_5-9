import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import pool from "../db.js";

const router = express.Router();

/**
 * GET /api/v1/calendar/events
 * Returns attendance & leave events scoped by role:
 * - Regular employee: Only their own attendance & leave records.
 * - Admin / HR Manager / Payroll Manager: All company employee records.
 */
router.get("/events", authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const userRole = req.user.role;
    const isPrivileged = ["admin", "hr_manager", "hr_payroll_manager"].includes(userRole);

    // 1. Resolve logged-in employee ID
    let currentEmpId = null;
    const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1 LIMIT 1", [req.user.id]);
    if (empRes.rows.length > 0) {
      currentEmpId = empRes.rows[0].id;
    } else {
      const emailRes = await pool.query("SELECT id FROM employees WHERE LOWER(email) = LOWER($1) LIMIT 1", [req.user.email]);
      if (emailRes.rows.length > 0) currentEmpId = emailRes.rows[0].id;
    }

    // 2. Fetch Attendance Records
    let attQuery = `
      SELECT 
        a.id, a.employee_id, e.name AS employee_name, a.attendance_date AS date, 
        a.check_in, a.check_out, a.worked_hours, a.status
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const attParams = [];

    if (!isPrivileged && currentEmpId) {
      attParams.push(currentEmpId);
      attQuery += ` AND a.employee_id = $${attParams.length}`;
    }

    if (start_date) {
      attParams.push(start_date);
      attQuery += ` AND a.attendance_date >= $${attParams.length}::date`;
    }
    if (end_date) {
      attParams.push(end_date);
      attQuery += ` AND a.attendance_date <= $${attParams.length}::date`;
    }

    attQuery += ` ORDER BY a.attendance_date ASC`;
    const attRes = await pool.query(attQuery, attParams);

    // 3. Fetch Approved Time-off Requests
    let leaveQuery = `
      SELECT 
        r.id, r.employee_id, e.name AS employee_name, 
        tot.name AS type_name, r.start_date, r.end_date, r.duration AS days, r.status
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN time_off_types tot ON r.type_id = tot.id
      WHERE r.status = 'approved'
    `;
    const leaveParams = [];

    if (!isPrivileged && currentEmpId) {
      leaveParams.push(currentEmpId);
      leaveQuery += ` AND r.employee_id = $${leaveParams.length}`;
    }

    if (start_date) {
      leaveParams.push(start_date);
      leaveQuery += ` AND r.end_date >= $${leaveParams.length}::date`;
    }
    if (end_date) {
      leaveParams.push(end_date);
      leaveQuery += ` AND r.start_date <= $${leaveParams.length}::date`;
    }

    const leaveRes = await pool.query(leaveQuery, leaveParams);

    // 4. Format Calendar Events
    const events = [];

    const toYYYYMMDD = (val) => {
      if (!val) return "";
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      return String(val).split("T")[0];
    };

    // Process Attendance -> Green / Yellow / Red
    attRes.rows.forEach((att) => {
      const hours = parseFloat(att.worked_hours || 0);
      let colorCategory = "green"; // Default Present
      let badgeLabel = "Present";

      if (att.status === "absent" || hours === 0) {
        colorCategory = "red";
        badgeLabel = "Absent";
      } else if (att.status === "half_day" || hours < 7.5) {
        colorCategory = "yellow";
        badgeLabel = `Half Day (${hours}h)`;
      } else {
        badgeLabel = `Present (${hours}h)`;
      }

      events.push({
        id: `att-${att.id}`,
        type: "attendance",
        employeeId: att.employee_id,
        employeeName: att.employee_name,
        date: toYYYYMMDD(att.date),
        colorCategory, // "green" | "yellow" | "red"
        title: `${att.employee_name}: ${badgeLabel}`,
        hours,
        status: att.status,
      });
    });

    // Process Leaves -> Blue
    leaveRes.rows.forEach((l) => {
      events.push({
        id: `leave-${l.id}`,
        type: "leave",
        employeeId: l.employee_id,
        employeeName: l.employee_name,
        startDate: toYYYYMMDD(l.start_date),
        endDate: toYYYYMMDD(l.end_date),
        colorCategory: "blue",
        title: `${l.employee_name}: On ${l.type_name || "Leave"}`,
        days: l.days,
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        events,
        isPrivileged,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
