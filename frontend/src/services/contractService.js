/**
 * Dynamic Contract Service
 * Integrates directly with backend PostgreSQL /contracts APIs.
 */

import api from "./api";

export const normalizeId = (id) => String(id || "").trim().replace(/^(emp|con)-/i, "");

export const isSameId = (a, b) => {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (strA === strB) return true;
  return normalizeId(strA) === normalizeId(strB);
};

function resolveEmployeeName(c) {
  if (c.employee?.name && c.employee.name !== "Employee") return c.employee.name;
  if (c.employee_name && c.employee_name !== "Employee") return c.employee_name;
  if (c.employeeName && c.employeeName !== "Employee") return c.employeeName;
  return c.employee_name || c.employee?.name || c.employeeName || "Employee";
}

function enforceSingleActiveContract(contractsList) {
  const byEmp = new Map();
  contractsList.forEach((c) => {
    const key = normalizeId(c.employeeId || c.employee_id);
    if (!byEmp.has(key)) byEmp.set(key, []);
    byEmp.get(key).push({ ...c });
  });

  const result = [];
  for (const [_, list] of byEmp.entries()) {
    // Sort chronologically ascending by start date
    list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const activeList = list.filter(
      (c) => String(c.status).toLowerCase() === "active"
    );

    // If there are multiple active contracts, keep the latest active one active
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

    result.push(...list);
  }

  // Return in descending chronological order
  return result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
}

export const getContracts = async ({
  search,
  employeeId,
  department,
  status,
  limit = 100,
  page = 1,
} = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append("search", search.trim());
  if (employeeId && employeeId !== "all") params.append("employee_id", normalizeId(employeeId));
  if (department && department !== "all") params.append("department", department);
  if (status && status !== "all") params.append("status", status.toLowerCase());
  if (limit) params.append("limit", limit);
  if (page && page > 1) params.append("offset", (page - 1) * limit);

  const response = await api.get(`/contracts?${params.toString()}`);
  const rows = response.data?.data?.contracts || response.data?.data;

  if (Array.isArray(rows)) {
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
      salaryStructure: c.structure_name || "Standard Corporate Structure",
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

  return [];
};

export const getContractById = async (id) => {
  const response = await api.get(`/contracts/${id}`);
  const c = response.data?.data?.contract || response.data?.data;
  if (!c) {
    throw new Error("Contract not found");
  }

  return {
    id: String(c.id),
    contractId: `CON-${String(c.id).padStart(4, "0")}`,
    employeeId: String(c.employee_id),
    employeeName: resolveEmployeeName(c),
    jobPosition: c.job_position || "Staff",
    department: c.department || "General",
    wage: parseFloat(c.wage) || 0,
    startDate: c.start_date ? c.start_date.split("T")[0] : "2023-01-01",
    endDate: c.end_date ? c.end_date.split("T")[0] : null,
    salaryStructure: c.structure_name || "Standard Corporate Structure",
    status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : "Draft",
  };
};

export const getContractsByEmployeeId = async (employeeId) => {
  const cleanId = normalizeId(employeeId);
  const response = await api.get(`/contracts/employee/${cleanId}`);
  const rows = response.data?.data?.contracts || (Array.isArray(response.data?.data) ? response.data.data : []);
  if (Array.isArray(rows)) {
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
      salaryStructure: c.structure_name || "Standard Corporate Structure",
      status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : "Draft",
    }));
    return enforceSingleActiveContract(mapped);
  }
  return [];
};

export const getActiveContractForEmployee = async (employeeId) => {
  const list = await getContractsByEmployeeId(employeeId);
  return list.find((c) => c.status.toLowerCase() === "active") || null;
};

export const createContract = async (data) => {
  const structureMap = {
    "Regular Salary": 1,
    "Contract Salary": 2,
    "Executive Salary": 3,
    "Part-Time Consultant Structure": 4,
  };

  const structureId =
    data.structureId ||
    structureMap[data.salaryStructure] ||
    1;

  const response = await api.post("/contracts", {
    employee_id: parseInt(normalizeId(data.employeeId), 10),
    wage: parseFloat(data.wage),
    start_date: data.startDate,
    end_date: data.endDate || null,
    structure_id: structureId,
    department: data.department,
    job_position: data.jobPosition,
    status: data.status ? data.status.toLowerCase() : "active",
  });
  return response.data?.data;
};

export const updateContract = async (id, data) => {
  const cleanId = parseInt(normalizeId(id), 10);
  const structureMap = {
    "Regular Salary": 1,
    "Contract Salary": 2,
    "Executive Salary": 3,
    "Part-Time Consultant Structure": 4,
  };

  const structureId =
    data.structureId ||
    (data.salaryStructure ? structureMap[data.salaryStructure] : undefined);

  const response = await api.put(`/contracts/${cleanId}`, {
    wage: data.wage !== undefined && data.wage !== "" ? parseFloat(data.wage) : undefined,
    start_date: data.startDate,
    end_date: data.endDate || null,
    department: data.department,
    job_position: data.jobPosition,
    structure_id: structureId,
    status: data.status ? data.status.toLowerCase() : undefined,
  });
  return response.data?.data;
};
