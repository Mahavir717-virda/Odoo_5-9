const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("./src/db");

async function seed() {
  console.log("🌱 Starting PeoplePay360 Database Setup & Seeding...");

  const client = await pool.connect();

  try {
    // 1. Execute schema.sql to ensure table structures exist
    console.log("📄 Applying db/schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, "db", "schema.sql"), "utf-8");
    await client.query(schemaSql);
    console.log("✅ Schema applied successfully.");

    await client.query("BEGIN");

    // 2. Demo Users (Admin, HR Manager, Payroll Manager, Employee)
    const devPassword = "Password123!";
    const hashedPassword = await bcrypt.hash(devPassword, 10);

    const usersData = [
      { email: "admin@gmail.com", role: "admin" },
      { email: "hr@gmail.com", role: "hr_manager" },
      { email: "payroll@gmail.com", role: "hr_payroll_manager" },
      { email: "employee@gmail.com", role: "employee" },
    ];

    const userMap = {};
    for (const u of usersData) {
      const res = await client.query(
        `INSERT INTO users (email, password, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
         RETURNING id, email, role`,
        [u.email, hashedPassword, u.role]
      );
      userMap[u.email] = res.rows[0].id;
    }
    console.log("✅ Users seeded.");

    // 3. Working Schedules (Standard 9-6, Mon-Fri)
    const scheduleLines = [
      { day: "monday", start: "09:00", end: "18:00", break: 60 },
      { day: "tuesday", start: "09:00", end: "18:00", break: 60 },
      { day: "wednesday", start: "09:00", end: "18:00", break: 60 },
      { day: "thursday", start: "09:00", end: "18:00", break: 60 },
      { day: "friday", start: "09:00", end: "18:00", break: 60 },
    ];

    const scheduleRes = await client.query(
      `INSERT INTO working_schedules (name, lines)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET lines = EXCLUDED.lines
       RETURNING id`,
      ["Standard 9-6", JSON.stringify(scheduleLines)]
    );
    const standardScheduleId = scheduleRes.rows[0].id;
    console.log("✅ Working schedule seeded.");

    // 4. Salary Rules
    const rulesData = [
      { name: "Basic Salary", code: "BASIC", category: "basic", sequence: 10, type: "fixed", value: 0.0 },
      { name: "House Rent Allowance", code: "HRA", category: "allowance", sequence: 20, type: "percent", value: 20.0 },
      { name: "Transport Allowance", code: "TRANSPORT", category: "allowance", sequence: 30, type: "fixed", value: 1600.0 },
      { name: "Gross Wage", code: "GROSS", category: "gross", sequence: 40, type: "formula", value: 0.0 },
      { name: "Provident Fund", code: "PF", category: "deduction", sequence: 50, type: "percent", value: 12.0 },
      { name: "Professional Tax", code: "PT", category: "deduction", sequence: 60, type: "fixed", value: 200.0 },
      { name: "Net Salary", code: "NET", category: "net", sequence: 70, type: "formula", value: 0.0 },
    ];

    const ruleIds = [];
    for (const r of rulesData) {
      const res = await client.query(
        `INSERT INTO salary_rules (name, code, category, sequence, type, value)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO UPDATE 
         SET name = EXCLUDED.name, category = EXCLUDED.category, sequence = EXCLUDED.sequence, type = EXCLUDED.type, value = EXCLUDED.value
         RETURNING id`,
        [r.name, r.code, r.category, r.sequence, r.type, r.value]
      );
      ruleIds.push(res.rows[0].id);
    }
    console.log("✅ Salary rules seeded.");

    // 5. Salary Structure (Standard Monthly Salary)
    const structRes = await client.query(
      `INSERT INTO salary_structures (name, rule_ids)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET rule_ids = EXCLUDED.rule_ids
       RETURNING id`,
      ["Standard Monthly Salary", ruleIds]
    );
    const standardStructureId = structRes.rows[0].id;
    console.log("✅ Salary structure seeded.");

    // 6. Employees
    const employeesData = [
      {
        name: "Rahul Sharma",
        email: "rahul.sharma@peoplepay360.com",
        phone: "+91 98765 43210",
        department: "Engineering",
        job_position: "Engineering Lead",
        employee_type: "full_time",
        user_id: userMap["admin@gmail.com"],
        manager_id: null,
      },
      {
        name: "Priya Patel",
        email: "priya.patel@peoplepay360.com",
        phone: "+91 98765 43211",
        department: "HR",
        job_position: "HR Manager",
        employee_type: "full_time",
        user_id: userMap["hr@gmail.com"],
        manager_id: null,
      },
      {
        name: "Amit Shah",
        email: "employee@gmail.com",
        phone: "+91 98765 43212",
        department: "Engineering",
        job_position: "Software Engineer",
        employee_type: "full_time",
        user_id: userMap["employee@gmail.com"],
        manager_id: null,
      },
    ];

    const employeeMap = {};
    for (const emp of employeesData) {
      const res = await client.query(
        `INSERT INTO employees (user_id, name, email, phone, department, job_position, employee_type, schedule_id, joining_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '2023-01-01', 'active')
         ON CONFLICT (email) DO UPDATE 
         SET name = EXCLUDED.name, department = EXCLUDED.department, job_position = EXCLUDED.job_position, schedule_id = EXCLUDED.schedule_id
         RETURNING id, name, email`,
        [emp.user_id, emp.name, emp.email, emp.phone, emp.department, emp.job_position, emp.employee_type, standardScheduleId]
      );
      employeeMap[emp.email] = res.rows[0].id;
    }

    // Assign Rahul as manager to Amit
    if (employeeMap["employee@gmail.com"] && employeeMap["rahul.sharma@peoplepay360.com"]) {
      await client.query(
        `UPDATE employees SET manager_id = $1 WHERE id = $2`,
        [employeeMap["rahul.sharma@peoplepay360.com"], employeeMap["employee@gmail.com"]]
      );
    }
    console.log("✅ Employees seeded.");

    // 7. Contracts
    const contractsData = [
      { email: "rahul.sharma@peoplepay360.com", wage: 50000.0, dept: "Engineering", pos: "Engineering Lead" },
      { email: "priya.patel@peoplepay360.com", wage: 45000.0, dept: "HR", pos: "HR Manager" },
      { email: "employee@gmail.com", wage: 40000.0, dept: "Engineering", pos: "Software Engineer" },
    ];

    for (const c of contractsData) {
      const empId = employeeMap[c.email];
      await client.query(
        `INSERT INTO contracts (employee_id, start_date, wage, structure_id, department, job_position, status)
         VALUES ($1, '2026-01-01', $2, $3, $4, $5, 'active')`,
        [empId, c.wage, standardStructureId, c.dept, c.pos]
      );
    }
    console.log("✅ Contracts seeded.");

    // 8. Attendance Records
    const amitId = employeeMap["employee@gmail.com"];
    const attendances = [
      { date: "2026-09-01", in: "2026-09-01 09:00:00+00", out: "2026-09-01 18:00:00+00", hours: 8.0, status: "present" },
      { date: "2026-09-02", in: "2026-09-02 09:15:00+00", out: "2026-09-02 18:00:00+00", hours: 7.75, status: "late" },
      { date: "2026-09-03", in: "2026-09-03 09:00:00+00", out: null, hours: 0.0, status: "present" },
    ];

    for (const att of attendances) {
      await client.query(
        `INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, worked_hours, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (employee_id, attendance_date) DO UPDATE
         SET check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, worked_hours = EXCLUDED.worked_hours, status = EXCLUDED.status`,
        [amitId, att.date, att.in, att.out, att.hours, att.status]
      );
    }
    console.log("✅ Attendance records seeded.");

    // 9. Time Off Types
    const timeOffTypes = [
      { name: "Paid Leave", unit: "days", req: true, aff: true },
      { name: "Sick Leave", unit: "days", req: true, aff: true },
      { name: "Unpaid Leave", unit: "days", req: false, aff: true },
    ];

    const typeMap = {};
    for (const t of timeOffTypes) {
      const res = await client.query(
        `INSERT INTO time_off_types (name, unit, requires_allocation, affects_payroll)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE SET unit = EXCLUDED.unit
         RETURNING id, name`,
        [t.name, t.unit, t.req, t.aff]
      );
      typeMap[t.name] = res.rows[0].id;
    }
    console.log("✅ Time off types seeded.");

    // 10. Time Off Allocations
    const paidLeaveTypeId = typeMap["Paid Leave"];
    const sickLeaveTypeId = typeMap["Sick Leave"];

    // Amit allocations: 20 Paid (2 taken, 18 remaining), 10 Sick (0 taken, 10 remaining)
    await client.query(
      `INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, remaining)
       VALUES ($1, $2, 20.00, 2.00, 18.00)
       ON CONFLICT (employee_id, type_id) DO UPDATE 
       SET allocated = EXCLUDED.allocated, taken = EXCLUDED.taken, remaining = EXCLUDED.remaining`,
      [amitId, paidLeaveTypeId]
    );

    await client.query(
      `INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, remaining)
       VALUES ($1, $2, 10.00, 0.00, 10.00)
       ON CONFLICT (employee_id, type_id) DO UPDATE 
       SET allocated = EXCLUDED.allocated, taken = EXCLUDED.taken, remaining = EXCLUDED.remaining`,
      [amitId, sickLeaveTypeId]
    );
    console.log("✅ Time off allocations seeded.");

    // 11. Time Off Requests (1 Approved, 1 Pending)
    await client.query(
      `INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, status, reason, approved_by, approved_at)
       VALUES ($1, $2, '2026-08-10', '2026-08-11', 2.00, 'approved', 'Annual leave', $3, NOW())`,
      [amitId, paidLeaveTypeId, userMap["hr@gmail.com"]]
    );

    await client.query(
      `INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, status, reason)
       VALUES ($1, $2, '2026-09-25', '2026-09-25', 1.00, 'pending', 'Personal errand')`,
      [amitId, paidLeaveTypeId]
    );
    console.log("✅ Time off requests seeded.");

    // 12. Payrun (Draft)
    await client.query(
      `INSERT INTO payruns (name, period_start, period_end, structure_id, status)
       VALUES ('September 2026 Payroll', '2026-09-01', '2026-09-30', $1, 'draft')`,
      [standardStructureId]
    );
    console.log("✅ Draft payrun seeded.");

    await client.query("COMMIT");
    console.log("\n🎉 PeoplePay360 Database Setup & Seeding Completed Successfully!");
    console.log("---------------------------------------------------------------");
    console.log("Demo User Accounts (Password for all: Password123!)");
    console.log("• Admin:             admin@gmail.com");
    console.log("• HR Manager:        hr@gmail.com");
    console.log("• Payroll Manager:   payroll@gmail.com");
    console.log("• Employee:          employee@gmail.com");
    console.log("---------------------------------------------------------------");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
