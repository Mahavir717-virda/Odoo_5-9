import { Clock } from "lucide-react";
import EmptyState from "../common/EmptyState";

/**
 * EmployeeTabPlaceholder Component
 * Clearly-labeled, employee-scoped placeholder for modules built in subsequent phases.
 *
 * @param {Object} props
 * @param {string} props.moduleName - e.g. "Contracts", "Attendance", "Time Off", "Payroll".
 * @param {string} props.employeeName - Name of the employee.
 * @param {string} props.phaseLabel - e.g. "Phase 2", "Phase 3", "Phase 4".
 */
export default function EmployeeTabPlaceholder({
  moduleName = "Module",
  employeeName = "this employee",
  phaseLabel = "Next Phase",
}) {
  return (
    <div className="py-6">
      <EmptyState
        icon={Clock}
        title={`${moduleName} — Coming in ${phaseLabel}`}
        description={`This tab will show ${employeeName}'s ${moduleName.toLowerCase()} records, filtered to this employee, once the ${moduleName} module is built.`}
      />
    </div>
  );
}
