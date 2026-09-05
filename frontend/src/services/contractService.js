/**
 * Dynamic Contract Service
 * Integrates with backend PostgreSQL /contracts APIs with local fallback.
 */

import api from "./api";
import { mockContracts } from "../data/mockContracts";

// In-memory fallback
let localContracts = [...mockContracts];

export const getContracts = async ({
  search,
  employeeId,
  department,
  status,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append("search", search.trim());
    if (department && department !== "all") params.append("department", department);
    if (status && status !== "all") params.append("status", status.toLowerCase());

    const response = await api.get(`/contracts?${params.toString()}`);
    const rows = response.data?.data?.contracts || response.data?.data || [];

    if (rows.length > 0) {
      return rows.map((c) => ({
        id: String(c.id),
        contractId: `CON-${String(c.id).padStart(4, "0")}`,
        employeeId: String(c.employee_id),
        employeeName: c.employee_name || "Employee",
        jobPosition: c.job_position || "Staff",
        department: c.department || "General",
        wage: parseFloat(c.wage) || 0,
        startDate: c.start_date ? c.start_date.split("T")[0] : "2023-01-01",
        endDate: c.end_date ? c.end_date.split("T")[0] : null,
        salaryStructure: c.structure_name || "Standard Software Engineer Structure",
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : "Draft",
      }));
    }
  } catch (err) {
    console.warn("Backend /contracts failed, using local mock data:", err.message);
  }

  let results = [...localContracts];
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (con) =>
        (con.contractId || "").toLowerCase().includes(q) ||
        (con.employeeName || "").toLowerCase().includes(q)
    );
  }
  if (employeeId && employeeId !== "all") {
    results = results.filter((con) => con.employeeId === employeeId);
  }
  if (department && department !== "all") {
    results = results.filter((con) => con.department.toLowerCase() === department.toLowerCase());
  }
  if (status && status !== "all") {
    results = results.filter((con) => con.status.toLowerCase() === status.toLowerCase());
  }
  return results;
};

export const getContractById = async (id) => {
  try {
    const response = await api.get(`/contracts/${id}`);
    const c = response.data?.data;
    if (c) {
      return {
        id: String(c.id),
        contractId: `CON-${String(c.id).padStart(4, "0")}`,
        employeeId: String(c.employee_id),
        employeeName: c.employee_name || "Employee",
        jobPosition: c.job_position || "Staff",
        department: c.department || "General",
        wage: parseFloat(c.wage) || 0,
        startDate: c.start_date ? c.start_date.split("T")[0] : "2023-01-01",
        endDate: c.end_date ? c.end_date.split("T")[0] : null,
        salaryStructure: c.structure_name || "Standard Software Engineer Structure",
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : "Draft",
      };
    }
  } catch (err) {
    console.warn(`Backend /contracts/${id} failed, checking local mock data:`, err.message);
  }

  const contract = localContracts.find((c) => String(c.id) === String(id));
  if (!contract) {
    throw new Error("Contract not found");
  }
  return { ...contract };
};

export const getContractsByEmployeeId = async (employeeId) => {
  try {
    const response = await api.get(`/employees/${employeeId}/contracts`);
    const rows = response.data?.data || [];
    if (rows.length > 0) {
      return rows.map((c) => ({
        id: String(c.id),
        contractId: `CON-${String(c.id).padStart(4, "0")}`,
        employeeId: String(c.employee_id),
        employeeName: c.employee_name || "Employee",
        jobPosition: c.job_position || "Staff",
        department: c.department || "General",
        wage: parseFloat(c.wage) || 0,
        startDate: c.start_date ? c.start_date.split("T")[0] : "2023-01-01",
        endDate: c.end_date ? c.end_date.split("T")[0] : null,
        salaryStructure: c.structure_name || "Standard Software Engineer Structure",
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : "Draft",
      }));
    }
  } catch (err) {
    console.warn(`Backend /employees/${employeeId}/contracts failed:`, err.message);
  }

  return localContracts
    .filter((c) => String(c.employeeId) === String(employeeId))
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
};

export const getActiveContractForEmployee = async (employeeId) => {
  const list = await getContractsByEmployeeId(employeeId);
  return list.find((c) => c.status.toLowerCase() === "active") || null;
};

export const createContract = async (data) => {
  try {
    const response = await api.post("/contracts", {
      employee_id: parseInt(data.employeeId, 10),
      wage: parseFloat(data.wage),
      start_date: data.startDate,
      end_date: data.endDate || null,
      structure_id: data.structureId || 1,
      department: data.department,
      job_position: data.jobPosition,
    });
    return response.data?.data;
  } catch (err) {
    console.warn("Backend createContract failed, storing locally:", err.message);
    const newId = `con-${Date.now()}`;
    const newContract = { id: newId, ...data };
    localContracts.push(newContract);
    return newContract;
  }
};

export const updateContract = async (id, data) => {
  try {
    const response = await api.put(`/contracts/${id}`, {
      wage: data.wage ? parseFloat(data.wage) : undefined,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status ? data.status.toLowerCase() : undefined,
    });
    return response.data?.data;
  } catch (err) {
    console.warn("Backend updateContract failed, updating locally:", err.message);
    const idx = localContracts.findIndex((c) => String(c.id) === String(id));
    if (idx !== -1) {
      localContracts[idx] = { ...localContracts[idx], ...data };
      return localContracts[idx];
    }
    return data;
  }
};
