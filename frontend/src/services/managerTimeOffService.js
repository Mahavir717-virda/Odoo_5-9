/**
 * Manager Time Off Service
 * Interacts with backend PostgreSQL /time-off endpoints for Requests, Allocations, and Types.
 */

import api from "./api";

// ==========================================
// 1. TIME OFF TYPES
// ==========================================

export const listTimeOffTypes = async () => {
  const response = await api.get("/time-off/types");
  return response.data?.data || [];
};

export const createTimeOffType = async (payload) => {
  const response = await api.post("/time-off/types", payload);
  return response.data?.data;
};

export const updateTimeOffType = async (id, payload) => {
  const response = await api.put(`/time-off/types/${id}`, payload);
  return response.data?.data;
};

// ==========================================
// 2. LEAVE ALLOCATIONS
// ==========================================

export const listAllocations = async ({ employee_id, type_id, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (employee_id) params.append("employee_id", employee_id);
  if (type_id) params.append("type_id", type_id);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/time-off/allocations?${params.toString()}`);
  return response.data;
};

export const createAllocation = async ({ employee_id, type_id, allocated }) => {
  const response = await api.post("/time-off/allocations", {
    employee_id: parseInt(employee_id, 10),
    type_id: parseInt(type_id, 10),
    allocated: parseFloat(allocated),
  });
  return response.data?.data;
};

export const updateAllocation = async (id, payload) => {
  const response = await api.put(`/time-off/allocations/${id}`, payload);
  return response.data?.data;
};

// ==========================================
// 3. LEAVE REQUESTS
// ==========================================

export const listRequests = async ({
  employee_id,
  type_id,
  status,
  from_date,
  to_date,
  page = 1,
  limit = 50,
} = {}) => {
  const params = new URLSearchParams();
  if (employee_id) params.append("employee_id", employee_id);
  if (type_id) params.append("type_id", type_id);
  if (status && status !== "all") params.append("status", status.toLowerCase());
  if (from_date) params.append("from_date", from_date);
  if (to_date) params.append("to_date", to_date);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/time-off/requests?${params.toString()}`);
  return response.data;
};

export const getRequestById = async (id) => {
  const response = await api.get(`/time-off/requests/${id}`);
  return response.data?.data;
};

export const createRequest = async ({ employee_id, time_off_type_id, start_date, end_date, reason }) => {
  const response = await api.post("/time-off/requests", {
    employee_id: parseInt(employee_id, 10),
    time_off_type_id: parseInt(time_off_type_id, 10),
    start_date,
    end_date,
    reason,
  });
  return response.data?.data;
};

export const approveRequest = async (id) => {
  const response = await api.patch(`/time-off/requests/${id}/approve`);
  window.dispatchEvent(new Event("notifications-refresh"));
  return response.data?.data;
};

export const rejectRequest = async (id, reason) => {
  const response = await api.patch(`/time-off/requests/${id}/reject`, { reason });
  window.dispatchEvent(new Event("notifications-refresh"));
  return response.data?.data;
};

export const cancelRequest = async (id) => {
  const response = await api.patch(`/time-off/requests/${id}/cancel`);
  window.dispatchEvent(new Event("notifications-refresh"));
  return response.data?.data;
};

export default {
  listTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  listAllocations,
  createAllocation,
  updateAllocation,
  listRequests,
  getRequestById,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
};
