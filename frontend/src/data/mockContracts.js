/**
 * Mock Contracts Dataset
 *
 * NOTE: This file is actively imported by services/contractService.js
 * as the local in-memory data store for contract CRUD operations.
 * TODO: Replace with live API calls when backend is ready.
 */
import { mockEmployees } from "./mockEmployees";

const empMap = new Map(
  mockEmployees.map((emp) => [emp.id, `${emp.firstName} ${emp.lastName}`])
);

const rawContracts = [
  // emp-1: Marcus Vance (VP of Engineering) - 2 contracts (1 Expired, 1 Active)
  {
    id: "con-1",
    contractId: "CON/2021/0001",
    employeeId: "emp-1",
    employeeName: "Marcus Vance",
    department: "Engineering",
    jobPosition: "VP of Engineering",
    startDate: "2021-03-15",
    endDate: "2023-03-14",
    wage: 130000,
    salaryStructure: "Regular Salary",
    status: "Expired",
  },
  {
    id: "con-2",
    contractId: "CON/2023/0014",
    employeeId: "emp-1",
    employeeName: "Marcus Vance",
    department: "Engineering",
    jobPosition: "VP of Engineering",
    startDate: "2023-03-15",
    endDate: null,
    wage: 150000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-2: Sarah Jenkins (HR Director) - 2 contracts (1 Expired, 1 Active)
  {
    id: "con-3",
    contractId: "CON/2020/0004",
    employeeId: "emp-2",
    employeeName: "Sarah Jenkins",
    department: "HR",
    jobPosition: "HR Director",
    startDate: "2020-08-01",
    endDate: "2022-07-31",
    wage: 110000,
    salaryStructure: "Regular Salary",
    status: "Expired",
  },
  {
    id: "con-4",
    contractId: "CON/2022/0022",
    employeeId: "emp-2",
    employeeName: "Sarah Jenkins",
    department: "HR",
    jobPosition: "HR Director",
    startDate: "2022-08-01",
    endDate: null,
    wage: 135000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-3: Robert Sterling (Finance Director) - 2 contracts (1 Expired, 1 Active)
  {
    id: "con-5",
    contractId: "CON/2019/0002",
    employeeId: "emp-3",
    employeeName: "Robert Sterling",
    department: "Finance",
    jobPosition: "Finance Director",
    startDate: "2019-11-10",
    endDate: "2022-11-09",
    wage: 120000,
    salaryStructure: "Regular Salary",
    status: "Expired",
  },
  {
    id: "con-6",
    contractId: "CON/2022/0035",
    employeeId: "emp-3",
    employeeName: "Robert Sterling",
    department: "Finance",
    jobPosition: "Finance Director",
    startDate: "2022-11-10",
    endDate: null,
    wage: 145000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-4: Elena Rostova (Sales Director) - 1 Active
  {
    id: "con-7",
    contractId: "CON/2021/0009",
    employeeId: "emp-4",
    employeeName: "Elena Rostova",
    department: "Sales",
    jobPosition: "Sales Director",
    startDate: "2021-01-20",
    endDate: null,
    wage: 140000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-5: David Kim (Marketing Director) - 1 Active
  {
    id: "con-8",
    contractId: "CON/2021/0017",
    employeeId: "emp-5",
    employeeName: "David Kim",
    department: "Marketing",
    jobPosition: "Marketing Director",
    startDate: "2021-06-01",
    endDate: null,
    wage: 130000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-6: Amina Toure (Senior Software Engineer) - 2 contracts (1 Expired, 1 Active)
  {
    id: "con-9",
    contractId: "CON/2022/0008",
    employeeId: "emp-6",
    employeeName: "Amina Toure",
    department: "Engineering",
    jobPosition: "Senior Software Engineer",
    startDate: "2022-02-14",
    endDate: "2024-02-13",
    wage: 95000,
    salaryStructure: "Regular Salary",
    status: "Expired",
  },
  {
    id: "con-10",
    contractId: "CON/2024/0003",
    employeeId: "emp-6",
    employeeName: "Amina Toure",
    department: "Engineering",
    jobPosition: "Senior Software Engineer",
    startDate: "2024-02-14",
    endDate: null,
    wage: 115000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-7: Liam Gallagher (Frontend Developer) - 1 Active
  {
    id: "con-11",
    contractId: "CON/2022/0029",
    employeeId: "emp-7",
    employeeName: "Liam Gallagher",
    department: "Engineering",
    jobPosition: "Frontend Developer",
    startDate: "2022-09-01",
    endDate: null,
    wage: 85000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-8: Priya Patel (DevOps Engineer) - 1 Active (Contract Salary)
  {
    id: "con-12",
    contractId: "CON/2023/0019",
    employeeId: "emp-8",
    employeeName: "Priya Patel",
    department: "Engineering",
    jobPosition: "DevOps Engineer",
    startDate: "2023-04-10",
    endDate: "2025-04-09",
    wage: 90000,
    salaryStructure: "Contract Salary",
    status: "Active",
  },

  // emp-9: Carlos Mendez (HR Officer) - 1 Active
  {
    id: "con-13",
    contractId: "CON/2022/0015",
    employeeId: "emp-9",
    employeeName: "Carlos Mendez",
    department: "HR",
    jobPosition: "HR Officer",
    startDate: "2022-05-18",
    endDate: null,
    wage: 65000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-10: Jessica Taylor (Recruitment Specialist) - 1 Active
  {
    id: "con-14",
    contractId: "CON/2023/0006",
    employeeId: "emp-10",
    employeeName: "Jessica Taylor",
    department: "HR",
    jobPosition: "Recruitment Specialist",
    startDate: "2023-01-09",
    endDate: null,
    wage: 52000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-11: Chloe Bennett (Senior Accountant) - 1 Active (On Leave)
  {
    id: "con-15",
    contractId: "CON/2021/0023",
    employeeId: "emp-11",
    employeeName: "Chloe Bennett",
    department: "Finance",
    jobPosition: "Senior Accountant",
    startDate: "2021-07-15",
    endDate: null,
    wage: 88000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-12: Nathan Brooks (Financial Analyst) - 1 Active
  {
    id: "con-16",
    contractId: "CON/2023/0011",
    employeeId: "emp-12",
    employeeName: "Nathan Brooks",
    department: "Finance",
    jobPosition: "Financial Analyst",
    startDate: "2023-03-01",
    endDate: null,
    wage: 72000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-13: Tariq Al-Mansoor (Senior Account Executive) - 2 contracts (1 Expired, 1 Active)
  {
    id: "con-17",
    contractId: "CON/2021/0031",
    employeeId: "emp-13",
    employeeName: "Tariq Al-Mansoor",
    department: "Sales",
    jobPosition: "Senior Account Executive",
    startDate: "2021-10-04",
    endDate: "2023-10-03",
    wage: 78000,
    salaryStructure: "Regular Salary",
    status: "Expired",
  },
  {
    id: "con-18",
    contractId: "CON/2023/0048",
    employeeId: "emp-13",
    employeeName: "Tariq Al-Mansoor",
    department: "Sales",
    jobPosition: "Senior Account Executive",
    startDate: "2023-10-04",
    endDate: null,
    wage: 96000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-14: Sophie Martin (Sales Executive) - 1 Active
  {
    id: "con-19",
    contractId: "CON/2022/0041",
    employeeId: "emp-14",
    employeeName: "Sophie Martin",
    department: "Sales",
    jobPosition: "Sales Executive",
    startDate: "2022-11-28",
    endDate: null,
    wage: 62000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-15: Daniel O'Connor (Content Strategist) - 1 Active (On Leave)
  {
    id: "con-20",
    contractId: "CON/2022/0012",
    employeeId: "emp-15",
    employeeName: "Daniel O'Connor",
    department: "Marketing",
    jobPosition: "Content Strategist",
    startDate: "2022-04-05",
    endDate: null,
    wage: 70000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-16: Mei-Ling Chen (Marketing Specialist) - 1 Active
  {
    id: "con-21",
    contractId: "CON/2023/0027",
    employeeId: "emp-16",
    employeeName: "Mei-Ling Chen",
    department: "Marketing",
    jobPosition: "Marketing Specialist",
    startDate: "2023-06-15",
    endDate: null,
    wage: 48000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-17: Lucas Silva (QA Automation Engineer) - 1 Active (Contract Salary)
  {
    id: "con-22",
    contractId: "CON/2023/0036",
    employeeId: "emp-17",
    employeeName: "Lucas Silva",
    department: "Engineering",
    jobPosition: "QA Automation Engineer",
    startDate: "2023-08-01",
    endDate: "2024-07-31",
    wage: 82000,
    salaryStructure: "Contract Salary",
    status: "Active",
  },

  // emp-18: Hannah Schmidt (Payroll Specialist) - 1 Cancelled, 1 Expired
  {
    id: "con-23",
    contractId: "CON/2020/0007",
    employeeId: "emp-18",
    employeeName: "Hannah Schmidt",
    department: "Finance",
    jobPosition: "Payroll Specialist",
    startDate: "2020-03-01",
    endDate: "2023-12-31",
    wage: 68000,
    salaryStructure: "Regular Salary",
    status: "Expired",
  },
  {
    id: "con-24",
    contractId: "CON/2024/0001",
    employeeId: "emp-18",
    employeeName: "Hannah Schmidt",
    department: "Finance",
    jobPosition: "Payroll Specialist",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    wage: 75000,
    salaryStructure: "Regular Salary",
    status: "Cancelled",
  },

  // emp-19: Arthur Pendleton (Business Development Representative) - 1 Active
  {
    id: "con-25",
    contractId: "CON/2023/0045",
    employeeId: "emp-19",
    employeeName: "Arthur Pendleton",
    department: "Sales",
    jobPosition: "Business Development Representative",
    startDate: "2023-09-18",
    endDate: null,
    wage: 55000,
    salaryStructure: "Regular Salary",
    status: "Active",
  },

  // emp-20: Zoe Kowalski (Graphic Designer) - 1 Expired
  {
    id: "con-26",
    contractId: "CON/2022/0005",
    employeeId: "emp-20",
    employeeName: "Zoe Kowalski",
    department: "Marketing",
    jobPosition: "Graphic Designer",
    startDate: "2022-01-10",
    endDate: "2023-01-09",
    wage: 46000,
    salaryStructure: "Contract Salary",
    status: "Expired",
  },

  // Draft Contracts for Upcoming Hires / Promotions
  {
    id: "con-27",
    contractId: "CON/2026/0010",
    employeeId: "emp-7",
    employeeName: "Liam Gallagher",
    department: "Engineering",
    jobPosition: "Lead Frontend Engineer",
    startDate: "2026-10-01",
    endDate: null,
    wage: 110000,
    salaryStructure: "Regular Salary",
    status: "Draft",
  },
  {
    id: "con-28",
    contractId: "CON/2026/0014",
    employeeId: "emp-19",
    employeeName: "Arthur Pendleton",
    department: "Sales",
    jobPosition: "Account Executive",
    startDate: "2026-11-01",
    endDate: null,
    wage: 70000,
    salaryStructure: "Regular Salary",
    status: "Draft",
  },
];

// Helper to enforce at most ONE Active contract per employeeId and valid date ranges
function sanitizeContracts(contracts) {
  const byEmp = new Map();
  for (const c of contracts) {
    const empId = c.employeeId || c.employee_id;
    if (!byEmp.has(empId)) byEmp.set(empId, []);
    byEmp.get(empId).push(c);
  }

  const result = [];

  for (const [_, empContracts] of byEmp.entries()) {
    // Sort by startDate ascending
    empContracts.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const activeContracts = empContracts.filter(
      (c) => String(c.status).toLowerCase() === "active"
    );

    if (activeContracts.length > 1) {
      const latestActiveId = activeContracts[activeContracts.length - 1].id;

      for (let i = 0; i < empContracts.length; i++) {
        const c = { ...empContracts[i] };
        if (
          String(c.status).toLowerCase() === "active" &&
          c.id !== latestActiveId
        ) {
          c.status = "Expired";
          const nextContract = empContracts[i + 1];
          if (nextContract && nextContract.startDate) {
            const nextStart = new Date(nextContract.startDate);
            const prevEnd = new Date(nextStart.getTime() - 86400000);
            c.endDate = prevEnd.toISOString().split("T")[0];

            // Ensure startDate is realistically earlier than endDate
            if (new Date(c.startDate) >= new Date(c.endDate)) {
              const startDt = new Date(prevEnd.getTime() - 365 * 86400000);
              c.startDate = startDt.toISOString().split("T")[0];
            }
          } else if (!c.endDate) {
            c.endDate = "2024-12-31";
            if (new Date(c.startDate) >= new Date(c.endDate)) {
              c.startDate = "2024-01-01";
            }
          }
        }

        // Final sanity check for date ordering
        if (c.endDate && new Date(c.startDate) >= new Date(c.endDate)) {
          const endDt = new Date(c.endDate);
          const startDt = new Date(endDt.getTime() - 365 * 86400000);
          c.startDate = startDt.toISOString().split("T")[0];
        }

        result.push(c);
      }
    } else {
      for (const c of empContracts) {
        const item = { ...c };
        if (item.endDate && new Date(item.startDate) >= new Date(item.endDate)) {
          const endDt = new Date(item.endDate);
          const startDt = new Date(endDt.getTime() - 365 * 86400000);
          item.startDate = startDt.toISOString().split("T")[0];
        }
        result.push(item);
      }
    }
  }

  return result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
}

const denormalizedContracts = rawContracts.map((c) => ({
  ...c,
  employeeName: empMap.get(c.employeeId) || c.employeeName || "Employee",
}));

export const mockContracts = sanitizeContracts(denormalizedContracts);



