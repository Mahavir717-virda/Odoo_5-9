/**
 * Mock Working Schedules Dataset
 * Realistic working patterns across organization roles.
 *
 * CRITICAL RULE:
 * `weeklyHours` is NOT stored statically in data records; it is always derived
 * dynamically from `weeklyPattern` using `calculateWeeklyHours`.
 *
 * NOTE: Actively imported by services/scheduleService.js as its local store.
 * TODO: Replace with live API calls when backend is ready.
 */

export const mockSchedules = [
  {
    id: "sch-1",
    name: "40 Hours / Week",
    company: "PeoplePay360 Pvt Ltd",
    timezone: "Asia/Kolkata",
    status: "Active",
    weeklyPattern: [
      { day: "Monday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
      { day: "Tuesday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
      { day: "Wednesday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
      { day: "Thursday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
      { day: "Friday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
    ],
  },
  {
    id: "sch-2",
    name: "Night Shift",
    company: "PeoplePay360 Pvt Ltd",
    timezone: "Asia/Kolkata",
    status: "Active",
    weeklyPattern: [
      { day: "Monday", startTime: "22:00", endTime: "06:00", breakMinutes: 60 },
      { day: "Tuesday", startTime: "22:00", endTime: "06:00", breakMinutes: 60 },
      { day: "Wednesday", startTime: "22:00", endTime: "06:00", breakMinutes: 60 },
      { day: "Thursday", startTime: "22:00", endTime: "06:00", breakMinutes: 60 },
      { day: "Friday", startTime: "22:00", endTime: "06:00", breakMinutes: 60 },
    ],
  },
  {
    id: "sch-3",
    name: "Retail Weekend",
    company: "PeoplePay360 Pvt Ltd",
    timezone: "Asia/Kolkata",
    status: "Active",
    weeklyPattern: [
      { day: "Thursday", startTime: "10:00", endTime: "19:00", breakMinutes: 60 },
      { day: "Friday", startTime: "10:00", endTime: "19:00", breakMinutes: 60 },
      { day: "Saturday", startTime: "10:00", endTime: "20:00", breakMinutes: 60 },
      { day: "Sunday", startTime: "10:00", endTime: "20:00", breakMinutes: 60 },
    ],
  },
  {
    id: "sch-4",
    name: "Flexible Hybrid",
    company: "PeoplePay360 Pvt Ltd",
    timezone: "Asia/Kolkata",
    status: "Active",
    weeklyPattern: [
      { day: "Monday", startTime: "09:30", endTime: "18:00", breakMinutes: 30 },
      { day: "Tuesday", startTime: "09:30", endTime: "18:00", breakMinutes: 30 },
      { day: "Wednesday", startTime: "09:30", endTime: "18:00", breakMinutes: 30 },
      { day: "Thursday", startTime: "09:30", endTime: "18:00", breakMinutes: 30 },
      { day: "Friday", startTime: "09:30", endTime: "17:30", breakMinutes: 30 },
    ],
  },
  {
    id: "sch-5",
    name: "Part-time 20h",
    company: "PeoplePay360 Pvt Ltd",
    timezone: "Asia/Kolkata",
    status: "Active",
    weeklyPattern: [
      { day: "Monday", startTime: "09:00", endTime: "14:00", breakMinutes: 0 },
      { day: "Tuesday", startTime: "09:00", endTime: "14:00", breakMinutes: 0 },
      { day: "Wednesday", startTime: "09:00", endTime: "14:00", breakMinutes: 0 },
      { day: "Thursday", startTime: "09:00", endTime: "14:00", breakMinutes: 0 },
    ],
  },
  {
    id: "sch-6",
    name: "32 Hours / Week",
    company: "PeoplePay360 Pvt Ltd",
    timezone: "Asia/Kolkata",
    status: "Inactive",
    weeklyPattern: [
      { day: "Monday", startTime: "09:00", endTime: "17:30", breakMinutes: 30 },
      { day: "Tuesday", startTime: "09:00", endTime: "17:30", breakMinutes: 30 },
      { day: "Wednesday", startTime: "09:00", endTime: "17:30", breakMinutes: 30 },
      { day: "Thursday", startTime: "09:00", endTime: "17:30", breakMinutes: 30 },
    ],
  },
];
