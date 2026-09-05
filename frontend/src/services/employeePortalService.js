/**
 * MOCK SERVICE — Employee Self Service (ESS) Portal
 * Handles attendance logs, punch in/out, leave requests, balances, and payslips.
 */

import {
  mockEmployeeAttendance,
  mockLeaveBalances,
  mockLeaveRequests,
  mockEmployeePayslips,
  upcomingCompanyHolidays,
} from "../data/mockEmployeePortal";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// Mutable in-memory stores
let attendanceList = [...mockEmployeeAttendance];
let leaveRequests = [...mockLeaveRequests];
let leaveBalances = [...mockLeaveBalances];
let payslips = [...mockEmployeePayslips];

// Live punch state
let currentPunchState = {
  isClockedIn: true,
  clockInTime: "09:02 AM",
  isOnBreak: false,
  breakStartTime: null,
  totalWorkedMinutes: 440, // ~7h 20m
};

/**
 * Get dashboard statistics for the logged in employee
 */
export const getEmployeeDashboardData = async () => {
  await delay(200);

  const totalLeaveRemaining = leaveBalances.reduce(
    (acc, item) => acc + item.remaining,
    0
  );

  const pendingLeavesCount = leaveRequests.filter(
    (r) => r.status === "Pending"
  ).length;

  return {
    punchState: { ...currentPunchState },
    stats: {
      workedHoursThisMonth: "148h 30m",
      leaveDaysRemaining: totalLeaveRemaining,
      attendanceRate: "98.4%",
      daysToPayday: 26,
    },
    recentAttendance: attendanceList.slice(0, 5),
    recentLeaves: leaveRequests.slice(0, 3),
    holidays: upcomingCompanyHolidays,
  };
};

/**
 * Get attendance records with optional filtering
 */
export const getMyAttendance = async ({ status, month } = {}) => {
  await delay();

  let results = [...attendanceList];

  if (status && status !== "all") {
    results = results.filter(
      (item) => item.status.toLowerCase() === status.toLowerCase()
    );
  }

  if (month && month !== "all") {
    results = results.filter((item) => item.date.startsWith(month));
  }

  return {
    punchState: { ...currentPunchState },
    records: results,
    monthlySummary: {
      totalDays: 22,
      presentDays: 20,
      lateDays: 2,
      halfDays: 1,
      absentDays: 1,
      totalHours: "168h 15m",
      averageDailyHours: "8h 24m",
      overtimeHours: "3h 45m",
    },
  };
};

/**
 * Perform punch in / punch out / break actions
 */
export const recordClockInOut = async (action) => {
  await delay(150);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toISOString().split("T")[0];

  if (action === "clock-in") {
    currentPunchState = {
      isClockedIn: true,
      clockInTime: timeStr,
      isOnBreak: false,
      breakStartTime: null,
      totalWorkedMinutes: 0,
    };

    // Add or update today's log
    const existingIndex = attendanceList.findIndex((a) => a.date === dateStr);
    const newRecord = {
      id: `att-${Date.now()}`,
      date: dateStr,
      checkIn: timeStr,
      checkOut: "—",
      workedHours: "0h 00m",
      breakHours: "0m",
      overtime: "0h 00m",
      status: "Present",
    };

    if (existingIndex >= 0) {
      attendanceList[existingIndex] = { ...attendanceList[existingIndex], ...newRecord };
    } else {
      attendanceList.unshift(newRecord);
    }
  } else if (action === "clock-out") {
    currentPunchState = {
      isClockedIn: false,
      clockInTime: null,
      isOnBreak: false,
      breakStartTime: null,
      totalWorkedMinutes: currentPunchState.totalWorkedMinutes || 480,
    };

    if (attendanceList.length > 0 && attendanceList[0].date === dateStr) {
      attendanceList[0].checkOut = timeStr;
      attendanceList[0].workedHours = "8h 15m";
    }
  } else if (action === "start-break") {
    currentPunchState.isOnBreak = true;
    currentPunchState.breakStartTime = timeStr;
  } else if (action === "end-break") {
    currentPunchState.isOnBreak = false;
    currentPunchState.breakStartTime = null;
  }

  return { ...currentPunchState };
};

/**
 * Get leave balances and requests
 */
export const getMyTimeOffData = async () => {
  await delay();

  return {
    balances: [...leaveBalances],
    requests: [...leaveRequests],
  };
};

/**
 * Submit a new leave request
 */
export const submitTimeOffRequest = async (requestData) => {
  await delay(300);

  const newRequest = {
    id: `lr-${Date.now()}`,
    appliedDate: new Date().toISOString().split("T")[0],
    status: "Pending",
    ...requestData,
  };

  leaveRequests.unshift(newRequest);
  return { ...newRequest };
};

/**
 * Cancel a pending leave request
 */
export const cancelTimeOffRequest = async (requestId) => {
  await delay(200);

  const index = leaveRequests.findIndex((r) => r.id === requestId);
  if (index === -1) {
    throw new Error("Leave request not found");
  }

  if (leaveRequests[index].status !== "Pending") {
    throw new Error("Only pending leave requests can be cancelled");
  }

  leaveRequests.splice(index, 1);
  return true;
};

/**
 * Get payslips list
 */
export const getMyPayslips = async () => {
  await delay();

  const totalGrossYTD = payslips.reduce((sum, p) => sum + p.grossEarnings, 0);
  const totalDeductionsYTD = payslips.reduce((sum, p) => sum + p.totalDeductions, 0);
  const totalNetYTD = payslips.reduce((sum, p) => sum + p.netPay, 0);

  return {
    summary: {
      grossYTD: totalGrossYTD,
      deductionsYTD: totalDeductionsYTD,
      netYTD: totalNetYTD,
      totalPayslips: payslips.length,
    },
    payslips: [...payslips],
  };
};

/**
 * Get single payslip details
 */
export const getPayslipDetails = async (payslipId) => {
  await delay(150);

  const slip = payslips.find((p) => p.id === payslipId);
  if (!slip) {
    throw new Error("Payslip not found");
  }

  return { ...slip };
};
