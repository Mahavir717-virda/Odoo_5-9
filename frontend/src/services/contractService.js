/**
 * MOCK SERVICE — replace each function body with a real axios call to the backend when available.
 * Function signatures and return shapes are designed to stay the same.
 */

import { mockContracts } from "../data/mockContracts";

const SIMULATED_DELAY_MS = 300;

const delay = (ms = SIMULATED_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mutable array of contracts
let contracts = [...mockContracts];

/**
 * Get filtered contracts list.
 * @param {Object} [filters]
 * @param {string} [filters.search] - Case-insensitive match on contractId or employeeName.
 * @param {string} [filters.employeeId] - Exact match employeeId.
 * @param {string} [filters.department] - Exact match department.
 * @param {string} [filters.status] - Exact match status.
 * @returns {Promise<Array<Object>>}
 */
export const getContracts = async ({
  search,
  employeeId,
  department,
  status,
} = {}) => {
  await delay();

  let results = [...contracts];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter((con) => {
      const contractId = (con.contractId || "").toLowerCase();
      const empName = (con.employeeName || "").toLowerCase();
      const position = (con.jobPosition || "").toLowerCase();
      return (
        contractId.includes(q) ||
        empName.includes(q) ||
        position.includes(q)
      );
    });
  }

  if (employeeId && employeeId !== "all") {
    results = results.filter((con) => con.employeeId === employeeId);
  }

  if (department && department !== "all") {
    results = results.filter(
      (con) => con.department.toLowerCase() === department.toLowerCase()
    );
  }

  if (status && status !== "all") {
    results = results.filter(
      (con) => con.status.toLowerCase() === status.toLowerCase()
    );
  }

  return results;
};

/**
 * Get single contract by ID.
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export const getContractById = async (id) => {
  await delay();

  const contract = contracts.find((c) => c.id === id);
  if (!contract) {
    throw new Error("Contract not found");
  }

  return { ...contract };
};

/**
 * Get all contracts for an employee sorted by startDate descending (most recent/active first).
 * Used by Contract Details and Employee Details' Contracts tab.
 * 
 * @param {string} employeeId 
 * @returns {Promise<Array<Object>>}
 */
export const getContractsByEmployeeId = async (employeeId) => {
  await delay();

  const employeeContracts = contracts
    .filter((c) => c.employeeId === employeeId)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return employeeContracts.map((c) => ({ ...c }));
};

/**
 * Returns the single "Active" running contract for that employee, or null.
 * 
 * NOTE: This is exactly the function Payroll (Phase 4) will call to determine 
 * "the contract applicable to the selected payroll period".
 * 
 * @param {string} employeeId 
 * @returns {Promise<Object|null>}
 */
export const getActiveContractForEmployee = async (employeeId) => {
  await delay();

  const activeContract = contracts.find(
    (c) => c.employeeId === employeeId && c.status.toLowerCase() === "active"
  );

  return activeContract ? { ...activeContract } : null;
};

/**
 * Create a new contract.
 * If creating an "Active" contract, any other active contract for that employee is marked "Expired".
 * 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const createContract = async (data) => {
  await delay();

  // IMPORTANT BUSINESS LOGIC: Ensure at most one Active contract per employee
  if (data.status === "Active" && data.employeeId) {
    contracts = contracts.map((c) => {
      if (c.employeeId === data.employeeId && c.status === "Active") {
        return {
          ...c,
          status: "Expired",
          endDate: c.endDate || data.startDate || new Date().toISOString().split("T")[0],
        };
      }
      return c;
    });
  }

  const newId = `con-${Date.now()}`;
  const pad = String(contracts.length + 1).padStart(4, "0");
  const contractId = data.contractId || `CON/${new Date().getFullYear()}/${pad}`;

  const newContract = {
    id: newId,
    contractId,
    salaryStructure: "Regular Salary",
    status: "Draft",
    ...data,
  };

  contracts.push(newContract);
  return { ...newContract };
};

/**
 * Update an existing contract.
 * If setting status to "Active", first flip any other "Active" contract for the same employeeId to "Expired".
 * 
 * @param {string} id 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const updateContract = async (id, data) => {
  await delay();

  const index = contracts.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Contract not found");
  }

  const targetEmployeeId = data.employeeId || contracts[index].employeeId;

  // IMPORTANT BUSINESS LOGIC: If flipping this contract to Active,
  // expire any other currently Active contract for this employee.
  if (data.status === "Active" && targetEmployeeId) {
    contracts = contracts.map((c) => {
      if (c.id !== id && c.employeeId === targetEmployeeId && c.status === "Active") {
        return {
          ...c,
          status: "Expired",
          endDate: c.endDate || data.startDate || contracts[index].startDate,
        };
      }
      return c;
    });
  }

  const updated = {
    ...contracts[index],
    ...data,
    id, // protect ID
  };

  contracts[index] = updated;
  return { ...updated };
};
