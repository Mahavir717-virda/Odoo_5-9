/**
 * Dynamic Contract Service
 * Integrates with backend PostgreSQL /contracts APIs with local fallback.
 */

import api from "./api";
import { mockContracts } from "../data/mockContracts";
import { mockEmployees } from "../data/mockEmployees";

const empMap = new Map(
  mockEmployees.map((e) => [String(e.id), `${e.firstName} ${e.lastName}`])
);

export const normalizeId = (id) => String(id || "").trim().replace(/^(emp|con)-/i, "");

export const isSameId = (a, b) => {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (strA === strB) return true;
  return normalizeId(strA) === normalizeId(strB);
};

function resolveEmployeeName(c) {
  if (c.employee_name && c.employee_name !== "Employee") return c.employee_name;
  if (c.employee?.name && c.employee?.name !== "Employee") return c.employee.name;
  if (c.employeeName && c.employeeName !== "Employee") return c.employeeName;
  const empId = String(c.employee_id || c.employeeId || "");
  const found = empMap.get(empId) || empMap.get(`emp-${empId}`);
  if (found) return found;
  return "Employee";
}

function enforceSingleActiveContract(contractsList) {
  const byEmp = new Map();
  contractsList.forEach((c) => {
    const key = normalizeId(c.employeeId || c.employee_id);
    if (!byEmp.has(key)) byEmp.set(key, []);
    byEmp.get(key).push(c);
  });

  const result = [];
  for (const [_, list] of byEmp.entries()) {
    // Sort chronologically ascending
    list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const activeList = list.filter(
      (c) => String(c.status).toLowerCase() === "active"
    );

    if (activeList.length > 1) {
      const latestActiveId = activeList[activeList.length - 1].id;
      for (const c of list) {
        if (
          String(c.status).toLowerCase() === "active" &&
          String(c.id) !== String(latestActiveId)
        ) {
          c.status = "Expired";
        }
      }
    }

    // Work backwards from newest contract to ensure strictly non-overlapping sequential date ranges
    for (let i = list.length - 1; i >= 0; i--) {
      const current = { ...list[i] };
      const next = list[i + 1];

      if (next && next.startDate) {
        const nextStart = new Date(next.startDate);
        const prevEnd = new Date(nextStart.getTime() - 86400000);
        current.endDate = prevEnd.toISOString().split("T")[0];

        if (!current.startDate || new Date(current.startDate) >= new Date(current.endDate)) {
          const startDt = new Date(prevEnd.getTime() - 365 * 86400000);
          current.startDate = startDt.toISOString().split("T")[0];
        }
      } else if (String(current.status).toLowerCase() === "expired" && !current.endDate) {
        current.endDate = "2024-12-31";
        if (new Date(current.startDate) >= new Date(current.endDate)) {
          current.startDate = "2024-01-01";
        }
      }

      list[i] = current;
    }

    result.push(...list);
  }

  // Preserve descending date order
  return result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
}

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
    if (employeeId && employeeId !== "all") params.append("employee_id", normalizeId(employeeId));
    if (department && department !== "all") params.append("department", department);
    if (status && status !== "all") params.append("status", status.toLowerCase());

    const response = await api.get(`/contracts?${params.toString()}`);
    const rows = response.data?.data?.contracts || response.data?.data || [];

    if (rows.length > 0) {
      let mapped = rows.map((c) => ({
        id: String(c.id),
        contractId: `CON-${String(c.id).padStart(4, "0")}`,
        employeeId: String(c.employee_id),
        employeeName: resolveEmployeeName(c),
        jobPosition: c.job_position || "Staff",
        department: c.department || "General",
        wage: parseFloat(c.wage) || 0,
        startDate: c.start_date ? c.start_date.split("T")[0] : "2023-01-01",
        endDate: c.end_date ? c.end_date.split("T")[0] : null,
        salaryStructure: c.structure_name || "Standard Software Engineer Structure",
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : "Draft",
      }));

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        mapped = mapped.filter(
          (con) =>
            (con.contractId || "").toLowerCase().includes(q) ||
            (con.employeeName || "").toLowerCase().includes(q) ||
            (con.jobPosition || "").toLowerCase().includes(q) ||
            (con.department || "").toLowerCase().includes(q) ||
            String(con.id || "").toLowerCase().includes(q)
        );
      }

      if (employeeId && employeeId !== "all") {
        mapped = mapped.filter((con) => isSameId(con.employeeId, employeeId));
      }

      return enforceSingleActiveContract(mapped);
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
        (con.employeeName || "").toLowerCase().includes(q) ||
        (con.jobPosition || "").toLowerCase().includes(q) ||
        (con.department || "").toLowerCase().includes(q) ||
        String(con.id || "").toLowerCase().includes(q)
    );
  }
  if (employeeId && employeeId !== "all") {
    results = results.filter((con) => isSameId(con.employeeId, employeeId));
  }
  if (department && department !== "all") {
    results = results.filter((con) => con.department.toLowerCase() === department.toLowerCase());
  }
  if (status && status !== "all") {
    results = results.filter((con) => con.status.toLowerCase() === status.toLowerCase());
  }
  return enforceSingleActiveContract(results);
};

export const getContractById = async (id) => {
  let target = null;

  try {
    const response = await api.get(`/contracts/${id}`);
    const c = response.data?.data;
    if (c) {
      target = {
        id: String(c.id),
        contractId: `CON-${String(c.id).padStart(4, "0")}`,
        employeeId: String(c.employee_id),
        employeeName: resolveEmployeeName(c),
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

  if (!target) {
    const contract = localContracts.find((c) => isSameId(c.id, id));
    if (!contract) {
      throw new Error("Contract not found");
    }
    target = { ...contract };
  }

  // Cross-reference with the employee's sanitized history to ensure 100% data consistency
  if (target && target.employeeId) {
    const empContracts = await getContractsByEmployeeId(target.employeeId);
    const matched = empContracts.find((c) => isSameId(c.id, target.id));
    if (matched) return matched;
  }

  return target;
};

export const getContractsByEmployeeId = async (employeeId) => {
  const cleanId = normalizeId(employeeId);
  try {
    const response = await api.get(`/employees/${cleanId}/contracts`);
    const rows = response.data?.data?.contracts || (Array.isArray(response.data?.data) ? response.data.data : []);
    if (rows && rows.length > 0) {
      const mapped = rows.map((c) => ({
        id: String(c.id),
        contractId: `CON-${String(c.id).padStart(4, "0")}`,
        employeeId: String(c.employee_id),
        employeeName: resolveEmployeeName(c),
        jobPosition: c.job_position || "Staff",
        department: c.department || "General",
        wage: parseFloat(c.wage) || 0,
        startDate: c.start_date ? c.start_date.split("T")[0] : "2023-01-01",
        endDate: c.end_date ? c.end_date.split("T")[0] : null,
        salaryStructure: c.structure_name || "Standard Software Engineer Structure",
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : "Draft",
      }));
      return enforceSingleActiveContract(mapped);
    }
  } catch (err) {
    console.warn(`Backend /employees/${cleanId}/contracts failed:`, err.message);
  }

  const matched = localContracts.filter((c) => isSameId(c.employeeId, employeeId));
  return enforceSingleActiveContract(
    [...matched].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  );
};

export const getActiveContractForEmployee = async (employeeId) => {
  const list = await getContractsByEmployeeId(employeeId);
  return list.find((c) => c.status.toLowerCase() === "active") || null;
};

export const createContract = async (data) => {
  try {
    const response = await api.post("/contracts", {
      employee_id: parseInt(normalizeId(data.employeeId), 10),
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
    const newNum = localContracts.length + 1;
    const year = new Date().getFullYear();
    const newId = `con-${Date.now()}`;
    const contractId = data.contractId || `CON/${year}/${String(newNum).padStart(4, "0")}`;
    const empName = data.employeeName || resolveEmployeeName(data);

    const newContract = {
      id: newId,
      contractId,
      employeeId: String(data.employeeId),
      employeeName: empName,
      department: data.department || "General",
      jobPosition: data.jobPosition || "Staff",
      startDate: data.startDate,
      endDate: data.endDate || null,
      wage: parseFloat(data.wage) || 0,
      salaryStructure: data.salaryStructure || "Regular Salary",
      status: data.status || "Active",
    };

    localContracts.push(newContract);
    localContracts = enforceSingleActiveContract(localContracts);
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
    const idx = localContracts.findIndex((c) => isSameId(c.id, id));
    if (idx !== -1) {
      localContracts[idx] = { ...localContracts[idx], ...data };
      localContracts = enforceSingleActiveContract(localContracts);
      return localContracts[idx];
    }
    return data;
  }
};
