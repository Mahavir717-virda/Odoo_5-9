/**
 * Manager Attendance Service
 * Interacts with backend PostgreSQL /attendance endpoints for company-wide attendance management.
 */

import api from "./api";

/**
 * List company-wide attendance with filters & pagination
 */
export const listAttendance = async ({
  employee_id,
  date,
  from_date,
  to_date,
  status,
  department,
  page = 1,
  limit = 20,
} = {}) => {
  const params = new URLSearchParams();
  if (employee_id) params.append("employee_id", employee_id);
  if (date) params.append("date", date);
  if (from_date) params.append("from_date", from_date);
  if (to_date) params.append("to_date", to_date);
  if (status && status !== "all") params.append("status", status.toLowerCase());
  if (department && department !== "all") params.append("department", department);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/attendance?${params.toString()}`);
  return response.data;
};

/**
 * Get single attendance record
 */
export const getAttendanceById = async (id) => {
  const response = await api.get(`/attendance/${id}`);
  return response.data?.data;
};

/**
 * Create manual attendance record for an employee
 */
export const createAttendance = async ({
  employee_id,
  attendance_date,
  check_in,
  check_out,
  status,
}) => {
  const response = await api.post("/attendance", {
    employee_id: parseInt(employee_id, 10),
    attendance_date,
    check_in,
    check_out,
    status: status ? status.toLowerCase() : "present",
  });
  return response.data?.data;
};

/**
 * Update attendance record
 */
export const updateAttendance = async (id, data) => {
  const response = await api.put(`/attendance/${id}`, data);
  return response.data?.data;
};

/**
 * Delete attendance record
 */
export const deleteAttendance = async (id) => {
  const response = await api.delete(`/attendance/${id}`);
  return response.data?.success;
};

export default {
  listAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};
