import pool from "../backend/src/db.js";
import attendanceService from "../backend/src/services/attendanceService.js";

async function runTest() {
  try {
    console.log("=== Testing Clock-In Persistence & Open Shift Handling ===");

    // 1. Get an existing employee
    const empRes = await pool.query("SELECT * FROM employees ORDER BY id ASC LIMIT 1");
    if (empRes.rows.length === 0) {
      console.log("No employees found.");
      process.exit(0);
    }
    const emp = empRes.rows[0];
    console.log(`Testing with Employee ID=${emp.id}, Name=${emp.name}`);

    // 2. Clean up any open test attendance logs for clean test run
    await pool.query(
      "DELETE FROM attendance WHERE employee_id = $1 AND attendance_date >= CURRENT_DATE - INTERVAL '1 day'",
      [emp.id]
    );

    // 3. Test check-in
    console.log("Performing check-in...");
    const checkInRes = await attendanceService.checkIn(emp.id);
    console.log("Check-in successful:", {
      id: checkInRes.id,
      date: checkInRes.attendance_date,
      check_in: checkInRes.check_in,
      status: checkInRes.status,
    });

    // 4. Test fetch list of attendance to verify active shift detection
    const empAttendance = await attendanceService.getEmployeeAttendance(emp.id);
    const activeLog = empAttendance.data.find((a) => {
      if (!a.check_in || a.check_out) return false;
      const checkInMs = new Date(a.check_in).getTime();
      const diffHours = (Date.now() - checkInMs) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 24;
    }) || empAttendance.data.find((a) => a.check_in && !a.check_out);

    console.log("Active log detected in employee attendance:", {
      found: Boolean(activeLog),
      id: activeLog?.id,
      check_in: activeLog?.check_in,
    });

    if (!activeLog) {
      throw new Error("Active shift was not detected!");
    }

    // 5. Test check-out
    console.log("Performing check-out...");
    const checkOutRes = await attendanceService.checkOut(emp.id);
    console.log("Check-out successful:", {
      id: checkOutRes.id,
      check_out: checkOutRes.check_out,
      worked_hours: checkOutRes.worked_hours,
    });

    console.log("SUCCESS: Clock-in persistence & shift detection verified cleanly!");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runTest();
