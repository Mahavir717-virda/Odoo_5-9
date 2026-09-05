/**
 * Fast Bulk Seeder for 5,000+ Attendance Logs
 * Generates realistic attendance entries across employees for performance testing.
 * Usage: node seed_attendance_scale.js [count]
 */

import pool from "./src/db.js";

async function seedBulkAttendance(targetCount = 5000) {
  console.log(`Starting bulk attendance generation (target ~${targetCount} records)...`);

  const empRes = await pool.query("SELECT id, name, joining_date FROM employees WHERE status = 'active'");
  const employees = empRes.rows;

  if (employees.length === 0) {
    console.error("No active employees found in database. Please add employees first.");
    process.exit(1);
  }

  console.log(`Found ${employees.length} active employees.`);

  // Date range: past 90 days up to today
  const today = new Date();
  const records = [];
  const statuses = ["present", "present", "present", "present", "late", "half_day"];

  for (let d = 90; d >= 0; d--) {
    const curr = new Date(today);
    curr.setDate(today.getDate() - d);

    // Skip Sundays
    if (curr.getDay() === 0) continue;

    const dateStr = curr.toISOString().split("T")[0];

    for (const emp of employees) {
      if (records.length >= targetCount) break;

      // Random variation in worked hours and status
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

    if (records.length >= targetCount) break;
  }

  console.log(`Generated ${records.length} attendance records in memory. Inserting in batches...`);

  // Insert in batch chunks of 500
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
    console.log(`Inserted ${inserted}/${records.length} records...`);
  }

  console.log(`Bulk attendance seed completed! Total records processed: ${inserted}`);
  process.exit(0);
}

const countArg = parseInt(process.argv[2], 10) || 5000;
seedBulkAttendance(countArg).catch((err) => {
  console.error("Bulk seed failed:", err);
  process.exit(1);
});
