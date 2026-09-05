/**
 * Working Schedule Hours Calculation Utilities
 */

/**
 * Parse HH:mm time string to total minutes from midnight
 * @param {string} timeStr - e.g. "09:00", "18:30"
 * @returns {number} minutes from midnight
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

/**
 * Calculate working hours for a single day entry
 * @param {string} startTime - "HH:mm" (e.g. "09:00")
 * @param {string} endTime - "HH:mm" (e.g. "18:00")
 * @param {number} [breakMinutes=0] - break duration in minutes (e.g. 60)
 * @returns {number} hours worked, rounded to 1 decimal place
 */
export function calculateDayHours(startTime, endTime, breakMinutes = 0) {
  if (!startTime || !endTime) return 0;

  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);

  // Handle overnight shifts where endTime is past midnight (e.g. 22:00 to 06:00)
  if (endMin <= startMin) {
    endMin += 24 * 60;
  }

  const breakMins = parseInt(breakMinutes, 10) || 0;
  const workedMinutes = Math.max(0, endMin - startMin - breakMins);
  const hours = workedMinutes / 60;

  return Math.round(hours * 10) / 10;
}

/**
 * Calculate total weekly hours across all entries in a weeklyPattern array
 * @param {Array<{ startTime: string, endTime: string, breakMinutes: number }>} [weeklyPattern=[]]
 * @returns {number} total weekly hours rounded to 1 decimal place
 */
export function calculateWeeklyHours(weeklyPattern = []) {
  if (!Array.isArray(weeklyPattern) || weeklyPattern.length === 0) return 0;

  const total = weeklyPattern.reduce((sum, day) => {
    return sum + calculateDayHours(day.startTime, day.endTime, day.breakMinutes);
  }, 0);

  return Math.round(total * 10) / 10;
}

/**
 * Format hours for display (e.g. "40h", "37.5h")
 * @param {number} hours
 * @returns {string}
 */
export function formatHours(hours) {
  if (hours == null || isNaN(hours)) return "0h";
  const num = Number(hours);
  return `${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}h`;
}
