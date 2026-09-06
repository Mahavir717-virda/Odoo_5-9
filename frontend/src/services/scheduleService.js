/**
 * Dynamic Working Schedule Service
 * Integrates with backend PostgreSQL /working-schedules APIs with local fallback.
 */

import api from "./api";
import { calculateWeeklyHours } from "../utils/scheduleCalculations";

// In-memory fallback
let localSchedules = [];

/**
 * Decorate a raw schedule object with live-calculated fields
 */
function formatScheduleRecord(s) {
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
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append("search", search.trim());
    if (status && status !== "all") params.append("status", status.toLowerCase());

    const response = await api.get(`/working-schedules?${params.toString()}`);
    const rows = response.data?.data?.schedules || response.data?.data || [];

    if (rows.length > 0) {
      return rows.map(formatScheduleRecord);
    }
  } catch (err) {
    console.warn("Backend /working-schedules failed, using local mock data:", err.message);
  }

  let results = [...localSchedules];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter((s) => (s.name || "").toLowerCase().includes(q));
  }

  if (status && status !== "all") {
    results = results.filter((s) => s.status.toLowerCase() === status.toLowerCase());
  }

  return results.map(formatScheduleRecord);
};

export const getScheduleById = async (id) => {
  try {
    const response = await api.get(`/working-schedules/${id}`);
    const s = response.data?.data;
    if (s) {
      return formatScheduleRecord(s);
    }
  } catch (err) {
    console.warn(`Backend /working-schedules/${id} failed, checking local mock data:`, err.message);
  }

  const found = localSchedules.find((s) => String(s.id) === String(id));
  if (!found) {
    throw new Error("Schedule not found");
  }

  return formatScheduleRecord(found);
};

export const createSchedule = async (data) => {
  try {
    const response = await api.post("/working-schedules", {
      name: data.name,
      company: data.company || "PeoplePay360 Pvt Ltd",
      timezone: data.timezone || "Asia/Kolkata",
      status: data.status ? data.status.toLowerCase() : "active",
      lines: data.weeklyPattern,
    });
    return formatScheduleRecord(response.data?.data);
  } catch (err) {
    console.warn("Backend createSchedule failed, storing locally:", err.message);
    const newId = `sch-${Date.now()}`;
    const newSchedule = {
      id: newId,
      name: data.name,
      company: data.company || "PeoplePay360 Pvt Ltd",
      timezone: data.timezone || "Asia/Kolkata",
      status: data.status || "Active",
      weeklyPattern: data.weeklyPattern || [],
    };
    localSchedules.push(newSchedule);
    return formatScheduleRecord(newSchedule);
  }
};

export const updateSchedule = async (id, data) => {
  try {
    const response = await api.put(`/working-schedules/${id}`, {
      name: data.name,
      company: data.company,
      timezone: data.timezone,
      status: data.status ? data.status.toLowerCase() : undefined,
      lines: data.weeklyPattern,
    });
    return formatScheduleRecord(response.data?.data);
  } catch (err) {
    console.warn("Backend updateSchedule failed, updating locally:", err.message);
    const idx = localSchedules.findIndex((s) => String(s.id) === String(id));
    if (idx !== -1) {
      localSchedules[idx] = {
        ...localSchedules[idx],
        ...data,
      };
      return formatScheduleRecord(localSchedules[idx]);
    }
    return formatScheduleRecord({ id, ...data });
  }
};

export const toggleScheduleStatus = async (id) => {
  const current = await getScheduleById(id);
  const newStatus = current.status === "Active" ? "Inactive" : "Active";
  return await updateSchedule(id, { ...current, status: newStatus });
};
