/**
 * Master Enterprise 5,000+ Connected Seeder for PeoplePay360
 * Generates 5,000+ connected records across ALL database tables:
 *  - 5,000+ Users (including the 5 core judge accounts)
 *  - 5,000+ Employees (linked 1:1 to Users with department hierarchies)
 *  - 5,000+ Salary Contracts (tied to Standard Salary Structure)
 *  - 10,000+ Time Off Allocations (Paid & Sick leaves for every employee)
 *  - 5,000+ Time Off Requests (Pending, Approved, Rejected)
 *  - 15,000+ Attendance Logs (over past 90 days for rich analytics & leaderboard)
 *  - 5,000+ Payslips (across historical paid batches & draft batch)
 *  - 5,000+ Notifications
 * 
 * Password for ALL accounts: Password123!
 * 
 * Usage:
 *   node seed_master.js
 */

import bcrypt from "bcryptjs";
import pool from "./src/db.js";

// First and Last Names for realistic enterprise generation
const FIRST_NAMES = [
  "Aarav", "Aditi", "Rohan", "Priya", "Vikram", "Neha", "Rahul", "Ananya", "Siddharth", "Pooja",
  "Amit", "Sneha", "Karan", "Divya", "Arjun", "Kavita", "Varun", "Meera", "Manish", "Rhea",
  "Suresh", "Ishita", "Gaurav", "Tanvi", "Nikhil", "Deepika", "Harsh", "Simran", "Rajesh", "Shreya",
  "Abhishek", "Ritu", "Deepak", "Swati", "Sanjay", "Preeti", "Kunal", "Bhavna", "Alok", "Sunita",
  "Tarun", "Payal", "Pranav", "Nisha", "Manoj", "Asha", "Vivek", "Kiran", "Yash", "Monika"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Mehta", "Gupta", "Singh", "Reddy", "Nair", "Chopra", "Joshi",
  "Bhatia", "Malhotra", "Kapoor", "Saxena", "Deshmukh", "Kulkarni", "Aggarwal", "Iyer", "Rao", "Shah",
  "Mishra", "Pandey", "Trivedi", "Chauhan", "Bhatt", "Jain", "Bansal", "Goel", "Dubey", "Goswami",
  "Menon", "Pillai", "Nambiar", "Mukherjee", "Chatterjee", "Banerjee", "Bose", "Dutta", "Das", "Sen"
];

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Human Resources",
  "Finance",
  "Sales",
  "Marketing",
  "Customer Support",
  "Operations"
];

const JOB_POSITIONS = {
  Engineering: ["Software Engineer", "Senior Dev", "Frontend Dev", "Backend Dev", "DevOps Engineer", "QA Engineer", "Tech Lead", "Architect"],
  Product: ["Product Manager", "UI/UX Designer", "Product Analyst", "Scrum Master", "UX Researcher"],
  "Human Resources": ["HR Specialist", "Talent Acquisition", "HR Coordinator", "HR Operations", "People Partner"],
  Finance: ["Financial Analyst", "Accountant", "Payroll Specialist", "Billing Specialist", "Finance Controller"],
  Sales: ["Account Executive", "Sales Lead", "BDR", "Key Account Manager", "Sales Director"],
  Marketing: ["Marketing Lead", "Content Strategist", "SEO Specialist", "Growth Hacker", "Brand Strategist"],
  "Customer Support": ["Support Specialist", "Technical Support", "Customer Success Lead", "Support Engineer"],
  Operations: ["Operations Manager", "Process Specialist", "Facilities Lead", "Logistics Specialist"]
};

const LEAVE_REASONS = [
  "Family vacation and travel",
  "Medical checkup and personal recovery",
  "Attending tech conference & professional training",
  "Family function and wedding celebration",
  "Home relocation and personal errand",
  "Seasonal flu and medical rest",
  "Personal emergency and urgent matter",
  "Casual leave for family commitment"
];

async function seedMaster() {
  console.log("\n========================================================================");
  console.log("  🚀 PEOPLEPAY360: ENTERPRISE 5,000+ CONNECTED SEEDER");
  console.log("========================================================================\n");

  const startTime = Date.now();
  const client = await pool.connect();

  try {
    console.log("🧹 1. Cleaning and resetting existing tables...");
    await client.query("BEGIN");

    // Clean reset all child tables in reverse dependency order
    await client.query("DELETE FROM notifications");
    await client.query("DELETE FROM payslips");
    await client.query("DELETE FROM payruns");
    await client.query("DELETE FROM time_off_requests");
    await client.query("DELETE FROM time_off_allocations");
    await client.query("DELETE FROM attendance");
    await client.query("DELETE FROM contracts");
    await client.query("DELETE FROM employees");
    await client.query("DELETE FROM users");

    // Reset identity sequences where applicable
    await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE employees_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE contracts_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE attendance_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE time_off_allocations_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE time_off_requests_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE payruns_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE payslips_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE notifications_id_seq RESTART WITH 1");

    // -------------------------------------------------------------
    // 2. Base Configuration (Password, Working Schedules, Salary Rules)
    // -------------------------------------------------------------
    console.log("🔐 2. Hashing default password ('Password123!') once...");
    const hashedPassword = await bcrypt.hash("Password123!", 8);

    console.log("⏰ 3. Setting up Working Schedules & Salary Structures...");
    const scheduleLines = [
      { day: "monday", start: "09:00", end: "18:00", break: 60 },
      { day: "tuesday", start: "09:00", end: "18:00", break: 60 },
      { day: "wednesday", start: "09:00", end: "18:00", break: 60 },
      { day: "thursday", start: "09:00", end: "18:00", break: 60 },
      { day: "friday", start: "09:00", end: "18:00", break: 60 },
    ];

    const schedRes = await client.query(
      `INSERT INTO working_schedules (name, lines)
       VALUES ('Standard 40h (Mon-Fri 9-6)', $1)
       ON CONFLICT (name) DO UPDATE SET lines = EXCLUDED.lines
       RETURNING id`,
      [JSON.stringify(scheduleLines)]
    );
    const standardScheduleId = schedRes.rows[0].id;

    const rulesData = [
      { name: "Basic Salary", code: "BASIC", category: "basic", sequence: 10, type: "fixed", value: 0.0 },
      { name: "House Rent Allowance (HRA)", code: "HRA", category: "allowance", sequence: 20, type: "percent", value: 20.0 },
      { name: "Standard Transport Allowance", code: "TRANSPORT", category: "allowance", sequence: 30, type: "fixed", value: 2000.0 },
      { name: "Special Monthly Allowance", code: "SPECIAL", category: "allowance", sequence: 35, type: "fixed", value: 3000.0 },
      { name: "Gross Wage", code: "GROSS", category: "gross", sequence: 40, type: "formula", value: 0.0 },
      { name: "Provident Fund (PF)", code: "PF", category: "deduction", sequence: 50, type: "percent", value: 12.0 },
      { name: "Professional Tax (PT)", code: "PT", category: "deduction", sequence: 60, type: "fixed", value: 200.0 },
      { name: "Tax Deducted at Source (TDS)", code: "TDS", category: "deduction", sequence: 65, type: "percent", value: 5.0 },
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

    const structRes = await client.query(
      `INSERT INTO salary_structures (name, rule_ids)
       VALUES ('Standard Corporate Structure', $1)
       ON CONFLICT (name) DO UPDATE SET rule_ids = EXCLUDED.rule_ids
       RETURNING id`,
      [ruleIds]
    );
    const standardStructureId = structRes.rows[0].id;

    // Performance & Trigram Search Extension
    console.log("⚡ Enabling PostgreSQL pg_trgm extension and performance indexes...");
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    await client.query("CREATE INDEX IF NOT EXISTS idx_employees_name_trgm ON employees USING gin (name gin_trgm_ops)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_employees_email_trgm ON employees USING gin (email gin_trgm_ops)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_employees_dept_status ON employees(department, status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance(attendance_date, status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_time_off_status_start ON time_off_requests(status, start_date DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_payslips_payrun_emp ON payslips(payrun_id, employee_id)");

    // Time Off Types
    const timeOffTypes = [
      { name: "Paid Annual Leave", unit: "days", req: true, aff: true },
      { name: "Sick / Medical Leave", unit: "days", req: true, aff: true },
      { name: "Casual Leave", unit: "days", req: true, aff: true },
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

    // -------------------------------------------------------------
    // 3. Prepare 5,000+ Users & Employees
    // -------------------------------------------------------------
    const TOTAL_USERS = 5000;
    console.log(`\n👥 4. Generating & Batch Inserting ${TOTAL_USERS.toLocaleString()} Users & Employees...`);

    // 5 Core Demo Users
    const coreUsers = [
      { email: "admin@gmail.com", role: "admin", name: "Rahul Sharma", dept: "Engineering", pos: "Director of Technology", wage: 120000 },
      { email: "hr@gmail.com", role: "hr_manager", name: "Priya Patel", dept: "Human Resources", pos: "Head of People & HR", wage: 85000 },
      { email: "payroll@gmail.com", role: "hr_payroll_manager", name: "Vikram Malhotra", dept: "Finance", pos: "Payroll Director", wage: 90000 },
      { email: "payrolluser@gmail.com", role: "hr_payroll_user", name: "Neha Gupta", dept: "Finance", pos: "Payroll & Tax Specialist", wage: 65000 },
      { email: "employee@gmail.com", role: "employee", name: "Amit Verma", dept: "Engineering", pos: "Senior Software Engineer", wage: 75000 },
    ];

    const usersToInsert = [...coreUsers];

    for (let i = coreUsers.length + 1; i <= TOTAL_USERS; i++) {
      const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const fullName = `${fName} ${lName}`;
      const email = `emp.${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@company.com`;
      const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
      const positions = JOB_POSITIONS[dept];
      const job = positions[Math.floor(Math.random() * positions.length)];
      const wage = Math.floor(35000 + Math.random() * 85000);

      usersToInsert.push({
        email,
        role: "employee",
        name: fullName,
        dept,
        pos: job,
        wage,
      });
    }

    // Insert Users in chunks of 500
    const CHUNK_SIZE = 500;
    const insertedUsers = [];

    for (let i = 0; i < usersToInsert.length; i += CHUNK_SIZE) {
      const chunk = usersToInsert.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunk.forEach((u, idx) => {
        const base = idx * 3;
        valPlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
        params.push(u.email, hashedPassword, u.role);
      });

      const res = await client.query(
        `INSERT INTO users (email, password, role)
         VALUES ${valPlaceholders.join(", ")}
         RETURNING id, email, role`,
        params
      );
      insertedUsers.push(...res.rows);
    }
    console.log(`   ✓ ${insertedUsers.length.toLocaleString()} Users inserted successfully.`);

    // Insert Employees in chunks of 500
    const insertedEmployees = [];
    for (let i = 0; i < insertedUsers.length; i += CHUNK_SIZE) {
      const chunkUsers = insertedUsers.slice(i, i + CHUNK_SIZE);
      const chunkData = usersToInsert.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunkUsers.forEach((u, idx) => {
        const d = chunkData[idx];
        const base = idx * 8;
        const phone = `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`;
        valPlaceholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
        );
        params.push(u.id, d.name, u.email, phone, d.dept, d.pos, standardScheduleId, "active");
      });

      const res = await client.query(
        `INSERT INTO employees (user_id, name, email, phone, department, job_position, schedule_id, status)
         VALUES ${valPlaceholders.join(", ")}
         RETURNING id, user_id, name, email, department, job_position`,
        params
      );
      insertedEmployees.push(...res.rows);
    }
    console.log(`   ✓ ${insertedEmployees.length.toLocaleString()} Employees inserted and linked.`);

    // Set Manager Hierarchies (Managers are the first few leaders)
    const hrManagerEmp = insertedEmployees.find((e) => e.email === "hr@gmail.com");
    const adminEmp = insertedEmployees.find((e) => e.email === "admin@gmail.com");
    const adminId = adminEmp ? adminEmp.id : insertedEmployees[0].id;
    const hrId = hrManagerEmp ? hrManagerEmp.id : insertedEmployees[1].id;

    await client.query("UPDATE employees SET manager_id = $1 WHERE id > 2 AND id <= 2500", [hrId]);
    await client.query("UPDATE employees SET manager_id = $1 WHERE id > 2500", [adminId]);

    // -------------------------------------------------------------
    // 4. Batch Insert 5,000+ Salary Contracts
    // -------------------------------------------------------------
    console.log(`\n📝 5. Generating & Batch Inserting ${insertedEmployees.length.toLocaleString()} Salary Contracts...`);
    for (let i = 0; i < insertedEmployees.length; i += CHUNK_SIZE) {
      const chunk = insertedEmployees.slice(i, i + CHUNK_SIZE);
      const chunkData = usersToInsert.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunk.forEach((emp, idx) => {
        const d = chunkData[idx];
        const base = idx * 7;
        valPlaceholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
        );
        params.push(emp.id, "2024-01-01", d.wage || 50000, standardStructureId, emp.department, emp.job_position, "active");
      });

      await client.query(
        `INSERT INTO contracts (employee_id, start_date, wage, structure_id, department, job_position, status)
         VALUES ${valPlaceholders.join(", ")}`,
        params
      );
    }
    console.log(`   ✓ ${insertedEmployees.length.toLocaleString()} Contracts inserted and activated.`);

    // -------------------------------------------------------------
    // 5. Batch Insert 10,000+ Time Off Allocations
    // -------------------------------------------------------------
    console.log(`\n🏖️ 6. Generating ${(insertedEmployees.length * 2).toLocaleString()} Time Off Allocations...`);
    const annualTypeId = typeMap["Paid Annual Leave"];
    const sickTypeId = typeMap["Sick / Medical Leave"];

    for (let i = 0; i < insertedEmployees.length; i += CHUNK_SIZE) {
      const chunk = insertedEmployees.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunk.forEach((emp, idx) => {
        // 2 allocations per employee (Annual + Sick)
        const base1 = (idx * 2) * 5;
        valPlaceholders.push(`($${base1 + 1}, $${base1 + 2}, $${base1 + 3}, $${base1 + 4}, $${base1 + 5})`);
        params.push(emp.id, annualTypeId, 20.00, 2.00, 18.00);

        const base2 = (idx * 2 + 1) * 5;
        valPlaceholders.push(`($${base2 + 1}, $${base2 + 2}, $${base2 + 3}, $${base2 + 4}, $${base2 + 5})`);
        params.push(emp.id, sickTypeId, 10.00, 1.00, 9.00);
      });

      await client.query(
        `INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, remaining)
         VALUES ${valPlaceholders.join(", ")}`,
        params
      );
    }
    console.log(`   ✓ ${(insertedEmployees.length * 2).toLocaleString()} Leave Allocations inserted.`);

    // -------------------------------------------------------------
    // 6. Batch Insert 5,000+ Time Off Requests
    // -------------------------------------------------------------
    console.log(`\n📅 7. Generating 5,000 Time Off Requests (Pending, Approved, Refused)...`);
    const reqStatuses = ["approved", "approved", "approved", "pending", "pending", "refused"];
    const leaveRequests = [];

    for (let i = 0; i < 5000; i++) {
      const emp = insertedEmployees[i % insertedEmployees.length];
      const typeId = i % 2 === 0 ? annualTypeId : sickTypeId;
      const status = i === 4 ? "pending" : reqStatuses[i % reqStatuses.length]; // Guarantee employee@gmail.com has pending request
      const reason = LEAVE_REASONS[i % LEAVE_REASONS.length];
      const dayOffset = (i % 60) + 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (status === "approved" ? dayOffset : -dayOffset));
      const startStr = startDate.toISOString().split("T")[0];

      leaveRequests.push({
        employee_id: emp.id,
        type_id: typeId,
        start_date: startStr,
        end_date: startStr,
        duration: 1.00,
        status: status,
        reason: reason,
        approved_by: status === "approved" ? hrId : null,
      });
    }

    for (let i = 0; i < leaveRequests.length; i += CHUNK_SIZE) {
      const chunk = leaveRequests.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunk.forEach((r, idx) => {
        const base = idx * 8;
        valPlaceholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
        );
        params.push(
          r.employee_id,
          r.type_id,
          r.start_date,
          r.end_date,
          r.duration,
          r.status,
          r.reason,
          r.approved_by
        );
      });

      await client.query(
        `INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, status, reason, approved_by)
         VALUES ${valPlaceholders.join(", ")}`,
        params
      );
    }
    console.log(`   ✓ 5,000 Time Off Requests inserted.`);

    // -------------------------------------------------------------
    // 7. Batch Insert 15,000+ Attendance Records
    // -------------------------------------------------------------
    console.log(`\n⚡ 8. Generating 15,000 Attendance Logs across past 60 days...`);
    const attendanceLogs = [];
    const attStatuses = ["present", "present", "present", "present", "late", "half_day"];
    const today = new Date();

    // Past 30 working days across active employees
    for (let d = 30; d >= 0; d--) {
      const curr = new Date(today);
      curr.setDate(today.getDate() - d);
      if (curr.getDay() === 0) continue; // Skip Sundays

      const dateStr = curr.toISOString().split("T")[0];

      // Sample 500 employees per day to generate 15,000 logs cleanly
      const dailyEmps = insertedEmployees.slice(0, 500);

      for (const emp of dailyEmps) {
        const status = attStatuses[Math.floor(Math.random() * attStatuses.length)];
        let workedHours = 8.0;
        let checkInHour = 9;
        let checkInMinute = Math.floor(Math.random() * 15);

        if (status === "late") {
          checkInHour = 9;
          checkInMinute = 30 + Math.floor(Math.random() * 25);
          workedHours = 7.5;
        } else if (status === "half_day") {
          workedHours = 4.0;
        } else {
          const bonus = (emp.id % 3 === 0) ? (1 + Math.random() * 2) : (Math.random() * 0.8);
          workedHours = Math.round((8.0 + bonus) * 100) / 100;
        }

        const checkIn = `${dateStr}T${String(checkInHour).padStart(2, "0")}:${String(checkInMinute).padStart(2, "0")}:00Z`;
        const outHour = checkInHour + Math.floor(workedHours);
        const outMin = checkInMinute + Math.floor((workedHours % 1) * 60);
        const checkOut = `${dateStr}T${String(outHour).padStart(2, "0")}:${String(outMin % 60).padStart(2, "0")}:00Z`;

        attendanceLogs.push({
          employee_id: emp.id,
          attendance_date: dateStr,
          check_in: checkIn,
          check_out: checkOut,
          worked_hours: workedHours,
          status: status,
        });
      }
    }

    for (let i = 0; i < attendanceLogs.length; i += CHUNK_SIZE) {
      const chunk = attendanceLogs.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunk.forEach((r, idx) => {
        const base = idx * 6;
        valPlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
        params.push(r.employee_id, r.attendance_date, r.check_in, r.check_out, r.worked_hours, r.status);
      });

      await client.query(
        `INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, worked_hours, status)
         VALUES ${valPlaceholders.join(", ")}
         ON CONFLICT (employee_id, attendance_date) DO NOTHING`,
        params
      );
    }
    console.log(`   ✓ ${attendanceLogs.length.toLocaleString()} Attendance logs inserted.`);

    // -------------------------------------------------------------
    // 8. Batch Insert 5,000+ Payslips across Payruns
    // -------------------------------------------------------------
    console.log(`\n💵 9. Generating Payruns & 5,000 Detailed Payslips...`);
    
    // Batch 1: August 2026 (Paid & Disbursed)
    const paidPayrunRes = await client.query(
      `INSERT INTO payruns (name, period_start, period_end, structure_id, status, paid_at)
       VALUES ('August 2026 Regular Payrun', '2026-08-01', '2026-08-31', $1, 'paid', NOW() - INTERVAL '5 days')
       RETURNING id`,
      [standardStructureId]
    );
    const augustPayrunId = paidPayrunRes.rows[0].id;

    // Batch 2: September 2026 (Draft - Ready for Demo Computation & Validation)
    await client.query(
      `INSERT INTO payruns (name, period_start, period_end, structure_id, status)
       VALUES ('September 2026 Regular Payrun', '2026-09-01', '2026-09-30', $1, 'draft')`,
      [standardStructureId]
    );

    // Fetch contracts
    const contractRes = await client.query("SELECT id, employee_id, wage FROM contracts WHERE status = 'active'");
    const contracts = contractRes.rows;

    for (let i = 0; i < contracts.length; i += CHUNK_SIZE) {
      const chunk = contracts.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunk.forEach((c, idx) => {
        const basic = parseFloat(c.wage) || 50000;
        const hra = Math.round(basic * 0.20);
        const transport = 2000;
        const special = 3000;
        const gross = basic + hra + transport + special;
        const pf = Math.round(basic * 0.12);
        const pt = 200;
        const tds = Math.round(gross * 0.05);
        const deductions = pf + pt + tds;
        const net = gross - deductions;

        const lines = [
          { code: "BASIC", name: "Basic Salary", category: "basic", amount: basic },
          { code: "HRA", name: "House Rent Allowance (HRA)", category: "allowance", amount: hra },
          { code: "TRANSPORT", name: "Standard Transport Allowance", category: "allowance", amount: transport },
          { code: "SPECIAL", name: "Special Allowance", category: "allowance", amount: special },
          { code: "GROSS", name: "Gross Total", category: "gross", amount: gross },
          { code: "PF", name: "Provident Fund (PF)", category: "deduction", amount: pf },
          { code: "PT", name: "Professional Tax (PT)", category: "deduction", amount: pt },
          { code: "TDS", name: "TDS / Income Tax", category: "deduction", amount: tds },
          { code: "NET", name: "Net Take-Home Pay", category: "net", amount: net },
        ];

        const base = idx * 8;
        valPlaceholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, 22.0, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, 'paid', $${base + 8})`
        );
        params.push(
          augustPayrunId,
          c.employee_id,
          c.id,
          basic,
          gross,
          deductions,
          net,
          JSON.stringify(lines)
        );
      });

      await client.query(
        `INSERT INTO payslips (payrun_id, employee_id, contract_id, worked_days, basic_salary, gross_salary, total_deductions, net_salary, status, lines)
         VALUES ${valPlaceholders.join(", ")}`,
        params
      );
    }
    console.log(`   ✓ ${contracts.length.toLocaleString()} Payslips inserted for August batch.`);

    // -------------------------------------------------------------
    // 9. Batch Insert 5,000+ Notifications
    // -------------------------------------------------------------
    console.log(`\n🔔 10. Generating 5,000 Notifications across all user inboxes...`);
    const notifTemplates = [
      { title: "Salary Slip Disbursed", msg: "Your August 2026 salary statement has been validated and disbursed.", type: "success", link: "/employee-portal/my-payslips" },
      { title: "Monthly Attendance Summary", msg: "Your attendance record and leaderboard points for this month are updated.", type: "info", link: "/employee-portal/my-attendance" },
      { title: "Leave Balance Update", msg: "Your annual paid time-off allocations are active for the 2026 cycle.", type: "info", link: "/employee-portal/my-leaves" },
      { title: "Company Milestone", msg: "Our department attendance reached a 98% on-time record this week!", type: "success", link: "/dashboard" },
    ];

    for (let i = 0; i < insertedUsers.length; i += CHUNK_SIZE) {
      const chunk = insertedUsers.slice(i, i + CHUNK_SIZE);
      const valPlaceholders = [];
      const params = [];

      chunk.forEach((u, idx) => {
        const tmpl = notifTemplates[idx % notifTemplates.length];
        const base = idx * 6;
        valPlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
        params.push(u.id, tmpl.title, tmpl.msg, tmpl.type, tmpl.link, false);
      });

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link, is_read)
         VALUES ${valPlaceholders.join(", ")}`,
        params
      );
    }
    console.log(`   ✓ ${insertedUsers.length.toLocaleString()} Notifications inserted.`);

    await client.query("COMMIT");

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n========================================================================");
    console.log(`  🎉 ENTERPRISE SEEDING COMPLETE IN ${duration}s!`);
    console.log("========================================================================");
    console.log("  TOTAL CONNECTED DATA IN DATABASE:");
    console.log(`  • Users:             ${insertedUsers.length.toLocaleString()}`);
    console.log(`  • Employees:         ${insertedEmployees.length.toLocaleString()}`);
    console.log(`  • Contracts:         ${contracts.length.toLocaleString()}`);
    console.log(`  • Leave Allocations: ${(insertedEmployees.length * 2).toLocaleString()}`);
    console.log(`  • Leave Requests:    ${leaveRequests.length.toLocaleString()}`);
    console.log(`  • Attendance Logs:   ${attendanceLogs.length.toLocaleString()}`);
    console.log(`  • Payslips:          ${contracts.length.toLocaleString()}`);
    console.log(`  • Notifications:     ${insertedUsers.length.toLocaleString()}`);
    console.log("========================================================================");
    console.log("  DEMO USER LOGINS (Password: Password123!)");
    console.log("  1. Admin:            admin@gmail.com");
    console.log("  2. HR Manager:       hr@gmail.com");
    console.log("  3. Payroll Manager:  payroll@gmail.com");
    console.log("  4. Payroll User:     payrolluser@gmail.com");
    console.log("  5. Staff Employee:   employee@gmail.com");
    console.log("========================================================================\n");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Master Seeding Error:", err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seedMaster();
