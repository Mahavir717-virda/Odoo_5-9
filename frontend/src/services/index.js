/**
 * Barrel export for all service modules.
 * Import from this file instead of individual service paths:
 *   import { employeeService, authService } from '../services';
 */
export * as authService from './authService';
export * as employeeService from './employeeService';
export * as contractService from './contractService';
export * as scheduleService from './scheduleService';
export * as employeePortalService from './employeePortalService';
export * as payrollManagerService from './payrollManagerService';
export * as managerAttendanceService from './managerAttendanceService';
export * as managerTimeOffService from './managerTimeOffService';
export * as settingsService from './settingsService';
// Note: api.js is the base Axios instance - import it directly when needed.
