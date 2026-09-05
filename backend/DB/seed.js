/**
 * Database Seed Script for PeoplePay360
 * Run with: node DB/seed.js
 */

import bcrypt from "bcryptjs";
import pool from "../src/db.js";

async function seedDatabase() {
  console.log("🌱 Starting Database Seeding...");

  try {
    // 1. Clean existing tables (in dependency order)
    console.log("🧹 Clearing old records...");
    await pool.query(`
      TRUNCATE TABLE payslips, payruns, time_off_requests, time_off_allocations, 
      time_off_types, attendance, contracts, salary_structures, salary_rules, 
      employees, working_schedules, users RESTART IDENTITY CASCADE;
    `);

    // 2. Insert Working Schedules
    console.log("⏰ Seeding working schedules...");
    const scheduleRes = await pool.query(`
      INSERT INTO working_schedules (name, lines)
      VALUES 
        ('Standard 40h (Mon-Fri 9-5)', '[{"day":"Monday","hours":8},{"day":"Tuesday","hours":8},{"day":"Wednesday","hours":8},{"day":"Thursday","hours":8},{"day":"Friday","hours":8}]'::jsonb),
        ('Flexible 35h', '[{"day":"Monday","hours":7},{"day":"Tuesday","hours":7},{"day":"Wednesday","hours":7},{"day":"Thursday","hours":7},{"day":"Friday","hours":7}]'::jsonb)
      RETURNING id, name;
    `);
    const standardScheduleId = scheduleRes.rows[0].id;

    // 3. Create Users
    console.log("👤 Seeding users...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    const userAdmin = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ["admin@odoo.com", hashedPassword, "admin"]
    );

    const userHrManager = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ["hr@odoo.com", hashedPassword, "hr_manager"]
    );

    const userPayroll = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ["payroll@odoo.com", hashedPassword, "hr_payroll_manager"]
    );

    const userEmployee = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ["alex.morgan@company.com", hashedPassword, "employee"]
    );

    const userEmployee2 = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ["employee@odoo.com", hashedPassword, "employee"]
    );

    // 4. Create Employees
    console.log("👔 Seeding employees...");
    const hrManagerEmp = await pool.query(`
      INSERT INTO employees (user_id, name, email, phone, department, job_position, employee_type, schedule_id, joining_date, status)
      VALUES ($1, 'Sarah Jenkins', 'hr@odoo.com', '+1 (555) 234-5678', 'Human Resources', 'HR Director', 'full_time', $2, '2022-01-15', 'active')
      RETURNING id;
    `, [userHrManager.rows[0].id, standardScheduleId]);
    const hrManagerId = hrManagerEmp.rows[0].id;

    const empAlex = await pool.query(`
      INSERT INTO employees (user_id, name, email, phone, department, manager_id, job_position, employee_type, schedule_id, joining_date, status)
      VALUES ($1, 'Alex Morgan', 'alex.morgan@company.com', '+1 (555) 019-2834', 'Engineering', $2, 'Senior Frontend Engineer', 'full_time', $3, '2023-03-01', 'active')
      RETURNING id;
    `, [userEmployee.rows[0].id, hrManagerId, standardScheduleId]);
    const alexId = empAlex.rows[0].id;

    const empGeneric = await pool.query(`
      INSERT INTO employees (user_id, name, email, phone, department, manager_id, job_position, employee_type, schedule_id, joining_date, status)
      VALUES ($1, 'John Doe', 'employee@odoo.com', '+1 (555) 456-7890', 'Product', $2, 'Product Designer', 'full_time', $3, '2023-06-15', 'active')
      RETURNING id;
    `, [userEmployee2.rows[0].id, hrManagerId, standardScheduleId]);
    const johnId = empGeneric.rows[0].id;

    // 5. Salary Rules & Structures
    console.log("💰 Seeding salary rules and structures...");
    const ruleBasic = await pool.query(
      "INSERT INTO salary_rules (name, code, category, sequence, type, value) VALUES ('Basic Salary', 'BASIC', 'basic', 1, 'fixed', 5000.00) RETURNING id"
    );
    const ruleHra = await pool.query(
      "INSERT INTO salary_rules (name, code, category, sequence, type, value) VALUES ('House Rent Allowance', 'HRA', 'allowance', 2, 'percent', 40.00) RETURNING id"
    );
    const rulePf = await pool.query(
      "INSERT INTO salary_rules (name, code, category, sequence, type, value) VALUES ('Provident Fund', 'PF', 'deduction', 3, 'percent', 12.00) RETURNING id"
    );

    const structureRes = await pool.query(
      "INSERT INTO salary_structures (name, rule_ids) VALUES ('Standard Software Engineer Structure', $1) RETURNING id",
      [[ruleBasic.rows[0].id, ruleHra.rows[0].id, rulePf.rows[0].id]]
    );
    const structureId = structureRes.rows[0].id;

    // 6. Contracts
    console.log("📄 Seeding contracts...");
    const contractRes = await pool.query(`
      INSERT INTO contracts (employee_id, start_date, wage, structure_id, department, job_position, status)
      VALUES ($1, '2023-03-01', 8500.00, $2, 'Engineering', 'Senior Frontend Engineer', 'active')
      RETURNING id;
    `, [alexId, structureId]);
    const contractId = contractRes.rows[0].id;

    // 7. Attendance Records for Alex
    console.log("⏱️ Seeding attendance history...");
    const attendanceDates = [
      { date: "2026-03-01", inTime: "09:00:00+00", outTime: "17:30:00+00", hours: 8.5, status: "present" },
      { date: "2026-03-02", inTime: "09:05:00+00", outTime: "17:35:00+00", hours: 8.5, status: "present" },
      { date: "2026-03-03", inTime: "09:35:00+00", outTime: "17:40:00+00", hours: 8.0, status: "late" },
      { date: "2026-03-04", inTime: "08:58:00+00", outTime: "17:00:00+00", hours: 8.0, status: "present" },
      { date: "2026-03-05", inTime: "09:02:00+00", outTime: null, hours: 0, status: "present" }, // Today clocked in
    ];

    for (const att of attendanceDates) {
      await pool.query(`
        INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, worked_hours, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (employee_id, attendance_date) DO UPDATE 
        SET check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, worked_hours = EXCLUDED.worked_hours, status = EXCLUDED.status;
      `, [alexId, att.date, att.inTime ? `${att.date}T${att.inTime}` : null, att.outTime ? `${att.date}T${att.outTime}` : null, att.hours, att.status]);
    }

    // 8. Time Off Types
    console.log("🌴 Seeding time off types & allocations...");
    const totPaid = await pool.query(
      "INSERT INTO time_off_types (name, unit, requires_allocation, affects_payroll) VALUES ('Paid Time Off (PTO)', 'days', true, false) RETURNING id"
    );
    const totSick = await pool.query(
      "INSERT INTO time_off_types (name, unit, requires_allocation, affects_payroll) VALUES ('Sick Leave', 'days', true, false) RETURNING id"
    );
    const totCasual = await pool.query(
      "INSERT INTO time_off_types (name, unit, requires_allocation, affects_payroll) VALUES ('Casual Leave', 'days', true, false) RETURNING id"
    );

    // Allocations for Alex
    await pool.query(`
      INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, remaining)
      VALUES 
        ($1, $2, 20.00, 6.00, 14.00),
        ($1, $3, 10.00, 2.00, 8.00),
        ($1, $4, 7.00, 1.00, 6.00);
    `, [alexId, totPaid.rows[0].id, totSick.rows[0].id, totCasual.rows[0].id]);

    // Sample Leave Requests
    await pool.query(`
      INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, status, reason, approved_at)
      VALUES 
        ($1, $2, '2026-03-20', '2026-03-24', 4.00, 'approved', 'Spring family vacation trip', NOW()),
        ($1, $3, '2026-02-12', '2026-02-13', 2.00, 'approved', 'Doctor appointment and recovery', NOW()),
        ($1, $4, '2026-04-10', '2026-04-10', 1.00, 'pending', 'Personal family function', NULL);
    `, [alexId, totPaid.rows[0].id, totSick.rows[0].id, totCasual.rows[0].id]);

    // 9. Payruns and Payslips
    console.log("💵 Seeding payruns and payslips...");
    const payrunFeb = await pool.query(`
      INSERT INTO payruns (name, period_start, period_end, structure_id, status, paid_at)
      VALUES ('February 2026 Payrun', '2026-02-01', '2026-02-28', $1, 'paid', '2026-02-28T18:00:00+00')
      RETURNING id;
    `, [structureId]);

    const payrunJan = await pool.query(`
      INSERT INTO payruns (name, period_start, period_end, structure_id, status, paid_at)
      VALUES ('January 2026 Payrun', '2026-01-01', '2026-01-31', $1, 'paid', '2026-01-31T18:00:00+00')
      RETURNING id;
    `, [structureId]);

    const sampleLines = JSON.stringify([
      { name: "Basic Salary", code: "BASIC", category: "basic", amount: 5500.00 },
      { name: "House Rent Allowance", code: "HRA", category: "allowance", amount: 2200.00 },
      { name: "Special Allowance", code: "SPL", category: "allowance", amount: 800.00 },
      { name: "Provident Fund (PF)", code: "PF", category: "deduction", amount: 660.00 },
      { name: "Professional Tax", code: "PTAX", category: "deduction", amount: 200.00 },
      { name: "TDS / Income Tax", code: "TAX", category: "deduction", amount: 450.00 },
    ]);

    await pool.query(`
      INSERT INTO payslips (payrun_id, employee_id, contract_id, worked_days, basic_salary, gross_salary, total_deductions, net_salary, lines, status)
      VALUES 
        ($1, $2, $3, 20.00, 5500.00, 8500.00, 1310.00, 7190.00, $4::jsonb, 'paid'),
        ($5, $2, $3, 22.00, 5500.00, 8500.00, 1310.00, 7190.00, $4::jsonb, 'paid');
    `, [payrunFeb.rows[0].id, alexId, contractId, sampleLines, payrunJan.rows[0].id]);

    console.log("✅ Database seeding completed successfully!");
    console.log("--------------------------------------------------");
    console.log("🔑 Test Accounts:");
    console.log("   - Employee 1: alex.morgan@company.com / Password123!");
    console.log("   - Employee 2: employee@odoo.com / Password123!");
    console.log("   - Admin:      admin@odoo.com / Password123!");
    console.log("   - HR Manager: hr@odoo.com / Password123!");
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedDatabase();
