import * as scheduleService from "../src/services/scheduleService.js";

async function runTest() {
  const schedules = await scheduleService.getSchedules();
  console.log("Loaded schedules count:", schedules.length);
  schedules.forEach((s) => {
    console.log(`- ${s.name}: ${s.daysPerWeek} days/wk, ${s.weeklyHours}h/wk (${s.status})`);
  });

  const single = await scheduleService.getScheduleById("1");
  console.log("\nSchedule 1 by ID:", single.name, "->", single.weeklyHours, "hours");
}

runTest().catch((err) => {
  console.error("Service test error:", err);
  process.exit(1);
});
