import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import { PERMISSIONS } from "./utils/permissions";

// Auth Pages
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ChangePassword from "./pages/ChangePassword";
import Logout from "./pages/Logout";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import Dashboard from "./pages/DashboardPage";

// Module Placeholder Pages
import EmployeesListPage from "./pages/employees/EmployeesListPage";
import EmployeeFormPage from "./pages/employees/EmployeeFormPage";
import EmployeeDetailsPage from "./pages/employees/EmployeeDetailsPage";

import ContractsPage from "./pages/contracts/ContractsPage";
import ContractDetailsPage from "./pages/contracts/ContractDetailsPage";
import ContractFormPage from "./pages/contracts/ContractFormPage";
import SchedulesPage from "./pages/schedules/SchedulesPage";
import ScheduleFormPage from "./pages/schedules/ScheduleFormPage";
import AttendancePage from "./pages/attendance/AttendancePage";

import TimeOffRequestsPage from "./pages/timeoff/TimeOffRequestsPage";
import TimeOffAllocationsPage from "./pages/timeoff/TimeOffAllocationsPage";
import TimeOffTypesPage from "./pages/timeoff/TimeOffTypesPage";

import PayrunsListPage from "./pages/payroll/PayrunsListPage";
import PayrunWizardPage from "./pages/payroll/PayrunWizardPage";
import PayrunDetailsPage from "./pages/payroll/PayrunDetailsPage";
import PayslipsListPage from "./pages/payroll/PayslipsListPage";
import PayslipDetailsPage from "./pages/payroll/PayslipDetailsPage";
import SalaryStructuresPage from "./pages/payroll/SalaryStructuresPage";
import SalaryRulesPage from "./pages/payroll/SalaryRulesPage";

import ReportsPage from "./pages/reports/ReportsPage";

import UsersSettingsPage from "./pages/settings/UsersSettingsPage";
import RolesSettingsPage from "./pages/settings/RolesSettingsPage";
import SystemSettingsPage from "./pages/settings/SystemSettingsPage";

import MyAttendancePage from "./pages/employee-portal/MyAttendancePage";
import MyTimeOffPage from "./pages/employee-portal/MyTimeOffPage";
import MyPayslipsPage from "./pages/employee-portal/MyPayslipsPage";

import IntroAnimation from "./components/common/IntroAnimation";

function App() {
  return (
    <AuthProvider>
      <IntroAnimation />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Application Layout & Nested Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/logout" element={<Logout />} />

            {/* Employees Module */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.VIEW}>
                  <EmployeesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/new"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.CREATE}>
                  <EmployeeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.VIEW}>
                  <EmployeeDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEE.EDIT}>
                  <EmployeeFormPage />
                </ProtectedRoute>
              }
            />

            {/* Contracts Module */}
            <Route
              path="/contracts"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.CONTRACT.VIEW}>
                  <ContractsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/new"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.CONTRACT.MANAGE}>
                  <ContractFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.CONTRACT.VIEW}>
                  <ContractDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id/edit"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.CONTRACT.MANAGE}>
                  <ContractFormPage />
                </ProtectedRoute>
              }
            />

            {/* Schedules Module */}
            <Route
              path="/schedules"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SCHEDULE.VIEW}>
                  <SchedulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/new"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SCHEDULE.MANAGE}>
                  <ScheduleFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/:id/edit"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SCHEDULE.MANAGE}>
                  <ScheduleFormPage />
                </ProtectedRoute>
              }
            />

            {/* Attendance Module */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.ATTENDANCE.VIEW}>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />

            {/* Time Off Module */}
            <Route
              path="/time-off/requests"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.TIMEOFF.VIEW}>
                  <TimeOffRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/allocations"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.TIMEOFF.VIEW}>
                  <TimeOffAllocationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/types"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.TIMEOFF.MANAGE_TYPES}>
                  <TimeOffTypesPage />
                </ProtectedRoute>
              }
            />

            {/* Payroll Module */}
            <Route
              path="/payroll/payruns"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.PAYRUN.VIEW}>
                  <PayrunsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payruns/new"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.PAYRUN.MANAGE}>
                  <PayrunWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payruns/:id"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.PAYRUN.VIEW}>
                  <PayrunDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payslips"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.PAYSLIP.VIEW}>
                  <PayslipsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payslips/:id"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.PAYSLIP.VIEW}>
                  <PayslipDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/salary-structures"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SALARY_STRUCTURE.VIEW}>
                  <SalaryStructuresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/salary-rules"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SALARY_RULE.VIEW}>
                  <SalaryRulesPage />
                </ProtectedRoute>
              }
            />

            {/* Reports Module */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS.VIEW}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Settings Module */}
            <Route
              path="/settings/users"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS.MANAGE_USERS}>
                  <UsersSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS.MANAGE_ROLES}>
                  <RolesSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/system"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS.MANAGE_SYSTEM}>
                  <SystemSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Employee Self Service Portal */}
            <Route path="/my-attendance" element={<MyAttendancePage />} />
            <Route path="/my-time-off" element={<MyTimeOffPage />} />
            <Route path="/my-payslips" element={<MyPayslipsPage />} />
          </Route>

          {/* 404 Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
