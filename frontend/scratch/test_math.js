import { calculateDayHours, calculateWeeklyHours, formatHours } from "../src/utils/scheduleCalculations.js";

// Test 1 day: 09:00 to 18:00 with 60 min break
const day1 = calculateDayHours("09:00", "18:00", 60);
console.log("Day 1 (09:00-18:00, 60m break):", day1, "hours");

// Test 5 days schedule
const pattern5Days = [
  { day: "Monday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
  { day: "Tuesday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
  { day: "Wednesday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
  { day: "Thursday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
  { day: "Friday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
];

const totalWeekly = calculateWeeklyHours(pattern5Days);
console.log("Weekly Total (5 days):", totalWeekly, "hours");
console.log("Formatted:", formatHours(totalWeekly));

if (day1 === 8 && totalWeekly === 40) {
  console.log("MATH VERIFICATION PASSED: 5x8h = 40h");
} else {
  console.error("MATH VERIFICATION FAILED!");
  process.exit(1);
}
