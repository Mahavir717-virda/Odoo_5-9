/**
 * Bulk Dummy Data Generator (5,000+ Records)
 * Supports high-performance batch insertion for:
 *  - 5,000 Attendance logs (across employees & past months)
 *  - 5,000 Employees & User accounts (with contracts & schedules)
 * 
 * Usage:
 *   node seed_bulk_data.js --type=attendance --count=5000
 *   node seed_bulk_data.js --type=employees --count=5000
 *   node seed_bulk_data.js --all
 */

import pool from "./src/db.js";
import bcrypt from "bcryptjs";

// First and Last Names for realistic generation
const FIRST_NAMES = [
  "Aarav", "Aditi", "Rohan", "Priya", "Vikram", "Neha", "Rahul", "Ananya", "Siddharth", "Pooja",
  "Amit", "Sneha", "Karan", "Divya", "Arjun", "Kavita", "Varun", "Meera", "Manish", "Rhea",
  "Suresh", "Ishita", "Gaurav", "Tanvi", "Nikhil", "Deepika", "Harsh", "Simran", "Rajesh", "Shreya",
  "Abhishek", "Ritu", "Deepak", "Swati", "Sanjay", "Preeti", "Kunal", "Bhavna", "Alok", "Sunita"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Mehta", "Gupta", "Singh", "Reddy", "Nair", "Chopra", "Joshi",
  "Bhatia", "Malhotra", "Kapoor", "Saxena", "Deshmukh", "Kulkarni", "Aggarwal", "Iyer", "Rao", "Shah",
  "Mishra", "Pandey", "Trivedi", "Chauhan", "Bhatt", "Jain", "Bansal", "Goel", "Dubey", "Goswami"
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
  Engineering: ["Software Engineer", "Senior Dev", "Frontend Dev", "Backend Dev", "DevOps Engineer", "QA Engineer", "Tech Lead"],
  Product: ["Product Manager", "UI/UX Designer", "Product Analyst", "Scrum Master"],
  "Human Resources": ["HR Specialist", "Talent Acquisition", "HR Coordinator", "HR Operations"],
  Finance: ["Financial Analyst", "Accountant", "Payroll Specialist", "Billing Specialist"],
  Sales: ["Account Executive", "Sales Lead", "BDR", "Key Account Manager"],
  Marketing: ["Marketing Lead", "Content Strategist", "SEO Specialist", "Growth Hacker"],
  "Customer Support": ["Support Specialist", "Technical Support", "Customer Success Lead"],
  Operations: ["Operations Manager", "Process Specialist", "Facilities Lead"]
};

// =========================================================================
// 1. GENERATE 5,000 ATTENDANCE LOGS
// =========================================================================
export async function seedAttendance(targetCount = 5000) {
  console.log(`\n======================================================`);
  console.log(`  🚀 GENERATING ${targetCount.toLocaleString()} ATTENDANCE RECORDS`);
  console.log(`======================================================\n`);

  const empRes = await pool.query("SELECT id, name FROM employees WHERE status = 'active'");
  let employees = empRes.rows;

  if (employees.length === 0) {
    console.log("⚠️ No active employees found. Creating 20 starter employees first...");
    await seedEmployees(20);
    const refreshed = await pool.query("SELECT id, name FROM employees WHERE status = 'active'");
    employees = refreshed.rows;
  }

  console.log(`✓ Distributing logs across ${employees.length} employees...`);

  const records = [];
  const statuses = ["present", "present", "present", "present", "present", "late", "half_day"];
  const today = new Date();

  // Span backwards over days until we hit target count
  let dayOffset = 0;
  while (records.length < targetCount) {
    const curr = new Date(today);
    curr.setDate(today.getDate() - dayOffset);
    dayOffset++;

    // Skip Sundays
    if (curr.getDay() === 0) continue;

    const dateStr = curr.toISOString().split("T")[0];

    // Shuffle employees to create realistic distribution
    const shuffled = [...employees].sort(() => Math.random() - 0.5);

    for (const emp of shuffled) {
      if (records.length >= targetCount) break;

      // 95% attendance probability on any working day
      if (Math.random() < 0.05) continue;

      const status = statuses[Math.floor(Math.random() * statuses.length)];
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
        // slight overtime variations for top performers
        const bonusHours = (emp.id % 3 === 0) ? (1 + Math.random() * 2) : (Math.random() * 0.8);
        workedHours = Math.round((8.0 + bonusHours) * 100) / 100;
      }

      const checkIn = `${dateStr}T${String(checkInHour).padStart(2, "0")}:${String(checkInMinute).padStart(2, "0")}:00Z`;
      const outHour = checkInHour + Math.floor(workedHours);
      const outMin = checkInMinute + Math.floor((workedHours % 1) * 60);
      const checkOut = `${dateStr}T${String(outHour).padStart(2, "0")}:${String(outMin % 60).padStart(2, "0")}:00Z`;

      records.push({
        employee_id: emp.id,
        attendance_date: dateStr,
        check_in: checkIn,
        check_out: checkOut,
        worked_hours: workedHours,
        status: status,
      });
    }
  }

  console.log(`✓ Generated ${records.length.toLocaleString()} records in memory. Inserting into PostgreSQL in batches...`);

  // Batch insert in chunks of 500
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const valuePlaceholders = [];
    const params = [];

    chunk.forEach((r, idx) => {
      const base = idx * 6;
      valuePlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
      params.push(r.employee_id, r.attendance_date, r.check_in, r.check_out, r.worked_hours, r.status);
    });

    const query = `
      INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, worked_hours, status)
      VALUES ${valuePlaceholders.join(", ")}
      ON CONFLICT (employee_id, attendance_date) DO UPDATE 
      SET check_in = EXCLUDED.check_in, 
          check_out = EXCLUDED.check_out, 
          worked_hours = EXCLUDED.worked_hours, 
          status = EXCLUDED.status
    `;

    await pool.query(query, params);
    inserted += chunk.length;
    process.stdout.write(`\r  ⚡ Inserted: ${inserted.toLocaleString()} / ${records.length.toLocaleString()} records...`);
  }

  console.log(`\n\n✅ Successfully seeded ${inserted.toLocaleString()} attendance records!`);
}

// =========================================================================
// 2. GENERATE 5,000 EMPLOYEES & USERS
// =========================================================================
export async function seedEmployees(targetCount = 5000) {
  console.log(`\n======================================================`);
  console.log(`  🚀 GENERATING ${targetCount.toLocaleString()} EMPLOYEES & USERS`);
  console.log(`======================================================\n`);

  // Get or create standard working schedule
  let schedRes = await pool.query("SELECT id FROM working_schedules LIMIT 1");
  let scheduleId = schedRes.rows[0]?.id;
  if (!scheduleId) {
    const newSched = await pool.query(
      "INSERT INTO working_schedules (name, lines) VALUES ('Standard 40h (9-5)', '[]'::jsonb) RETURNING id"
    );
    scheduleId = newSched.rows[0].id;
  }

  // Get or create standard salary structure
  let structRes = await pool.query("SELECT id FROM salary_structures LIMIT 1");
  let structureId = structRes.rows[0]?.id;
  if (!structureId) {
    const newStruct = await pool.query(
      "INSERT INTO salary_structures (name, rule_ids) VALUES ('Standard Salary Structure', '{}') RETURNING id"
    );
    structureId = newStruct.rows[0].id;
  }

  // Pre-hash default password once for speed
  console.log("✓ Pre-hashing password 'password123' for fast batch generation...");
  const hashedPassword = await bcrypt.hash("password123", 8);

  const timestamp = Date.now();
  const CHUNK_SIZE = 500;
  let totalCreated = 0;

  for (let c = 0; c < targetCount; c += CHUNK_SIZE) {
    const currentBatchSize = Math.min(CHUNK_SIZE, targetCount - c);
    
    // 1. Prepare Users
    const userPlaceholders = [];
    const userParams = [];
    const batchData = [];

    for (let i = 0; i < currentBatchSize; i++) {
      const idx = c + i + 1;
      const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const fullName = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${timestamp}.${idx}@company.com`;
      const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
      const positions = JOB_POSITIONS[dept];
      const job = positions[Math.floor(Math.random() * positions.length)];
      const phone = `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`;
      const wage = Math.floor(30000 + Math.random() * 90000);

      const uBase = i * 3;
      userPlaceholders.push(`($${uBase + 1}, $${uBase + 2}, $${uBase + 3})`);
      userParams.push(email, hashedPassword, "employee");

      batchData.push({ fullName, email, phone, dept, job, wage });
    }

    // Insert Users
    const userQuery = `
      INSERT INTO users (email, password, role)
      VALUES ${userPlaceholders.join(", ")}
      RETURNING id, email
    `;
    const insertedUsersRes = await pool.query(userQuery, userParams);
    const insertedUsers = insertedUsersRes.rows;

    // 2. Prepare Employees
    const empPlaceholders = [];
    const empParams = [];

    for (let i = 0; i < insertedUsers.length; i++) {
      const u = insertedUsers[i];
      const d = batchData[i];
      const eBase = i * 8;
      empPlaceholders.push(
        `($${eBase + 1}, $${eBase + 2}, $${eBase + 3}, $${eBase + 4}, $${eBase + 5}, $${eBase + 6}, $${eBase + 7}, $${eBase + 8})`
      );
      empParams.push(
        u.id,
        d.fullName,
        d.email,
        d.phone,
        d.dept,
        d.job,
        scheduleId,
        "active"
      );
    }

    const empQuery = `
      INSERT INTO employees (user_id, name, email, phone, department, job_position, schedule_id, status)
      VALUES ${empPlaceholders.join(", ")}
      RETURNING id, department, job_position
    `;
    const insertedEmpsRes = await pool.query(empQuery, empParams);
    const insertedEmps = insertedEmpsRes.rows;

    // 3. Prepare Active Contracts
    const contractPlaceholders = [];
    const contractParams = [];

    for (let i = 0; i < insertedEmps.length; i++) {
      const emp = insertedEmps[i];
      const d = batchData[i];
      const cBase = i * 7;
      contractPlaceholders.push(
        `($${cBase + 1}, $${cBase + 2}, $${cBase + 3}, $${cBase + 4}, $${cBase + 5}, $${cBase + 6}, $${cBase + 7})`
      );
      contractParams.push(
        emp.id,
        "2025-01-01",
        d.wage,
        structureId,
        emp.department,
        emp.job_position,
        "active"
      );
    }

    const contractQuery = `
      INSERT INTO contracts (employee_id, start_date, wage, structure_id, department, job_position, status)
      VALUES ${contractPlaceholders.join(", ")}
    `;
    await pool.query(contractQuery, contractParams);

    totalCreated += currentBatchSize;
    process.stdout.write(`\r  ⚡ Created: ${totalCreated.toLocaleString()} / ${targetCount.toLocaleString()} employees...`);
  }

  console.log(`\n\n✅ Successfully generated & linked ${totalCreated.toLocaleString()} employees, users, and contracts!`);
}

// =========================================================================
// CLI RUNNER
// =========================================================================
async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1] || "attendance";
  const countArg = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] || "5000", 10);
  const isAll = args.includes("--all");

  const startTime = Date.now();

  try {
    if (isAll) {
      await seedEmployees(countArg);
      await seedAttendance(countArg);
    } else if (typeArg === "employees" || typeArg === "employee") {
      await seedEmployees(countArg);
    } else {
      await seedAttendance(countArg);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Completed successfully in ${duration}s!\n`);
  } catch (err) {
    console.error("\n❌ Seeding error:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

if (process.argv[1]?.endsWith("seed_bulk_data.js")) {
  main();
}
