/**
 * Dynamic Working Schedule Service
 * Integrates directly with backend PostgreSQL /working-schedules APIs.
 */

import api from "./api";
import { calculateWeeklyHours } from "../utils/scheduleCalculations";

// In-memory fallback
let localSchedules = [];

/**
 * Decorate a raw schedule object with live-calculated fields
 */
function formatScheduleRecord(s) {
  if (!s) return null;
  const pattern = s.weeklyPattern || s.lines || [];
  return {
    id: String(s.id),
    name: s.name || "Schedule",
    company: s.company || "PeoplePay360 Pvt Ltd",
    timezone: s.timezone || "Asia/Kolkata",
    status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : "Active",
    weeklyPattern: pattern,
    weeklyHours: calculateWeeklyHours(pattern),
    daysPerWeek: pattern.length,
  };
}

export const getSchedules = async ({ search, status } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append("search", search.trim());
  if (status && status !== "all") params.append("status", status.toLowerCase());

  const response = await api.get(`/working-schedules?${params.toString()}`);
  const rows = response.data?.data?.schedules || response.data?.data || [];

  if (Array.isArray(rows)) {
    return rows.map(formatScheduleRecord);
  }
  return [];
};

export const getScheduleById = async (id) => {
  const response = await api.get(`/working-schedules/${id}`);
  const s = response.data?.data;
  if (!s) {
    throw new Error("Schedule not found");
  }
  return formatScheduleRecord(s);
};

export const createSchedule = async (data) => {
  const response = await api.post("/working-schedules", {
    name: data.name,
    company: data.company || "PeoplePay360 Pvt Ltd",
    timezone: data.timezone || "Asia/Kolkata",
    status: data.status ? data.status.toLowerCase() : "active",
    lines: data.weeklyPattern,
  });
  return formatScheduleRecord(response.data?.data);
};

export const updateSchedule = async (id, data) => {
  const response = await api.put(`/working-schedules/${id}`, {
    name: data.name,
    company: data.company,
    timezone: data.timezone,
    status: data.status ? data.status.toLowerCase() : undefined,
    lines: data.weeklyPattern,
  });
  return formatScheduleRecord(response.data?.data);
};

export const toggleScheduleStatus = async (id) => {
  const current = await getScheduleById(id);
  const newStatus = current.status === "Active" ? "Inactive" : "Active";
  return await updateSchedule(id, { ...current, status: newStatus });
};
