import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import StatusBadge from "../common/StatusBadge";
import { Mail, Phone, Briefcase, Calendar } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Get two-letter initials from name.
 */
function getInitials(firstName, lastName) {
  const first = firstName ? firstName[0].toUpperCase() : "";
  const last = lastName ? lastName[0].toUpperCase() : "";
  return `${first}${last}` || "U";
}

/**
 * EmployeeCard Component (for Kanban / Grid view)
 *
 * @param {Object} props
 * @param {Object} props.employee
 * @param {Function} [props.onClick]
 */
export default function EmployeeCard({ employee, onClick }) {
  const {
    firstName,
    lastName,
    email,
    phone,
    avatarUrl,
    department,
    jobPosition,
    employeeId,
    status,
    workSchedule,
  } = employee;

  const fullName = `${firstName} ${lastName}`;
  const initials = getInitials(firstName, lastName);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
      className="h-full"
    >
      <Card
        onClick={() => onClick && onClick(employee)}
        className={cn(
          "h-full flex flex-col justify-between cursor-pointer border border-border bg-card",
          "hover:border-primary/40 hover:shadow-md transition-all duration-200"
        )}
      >
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
          {/* Top Row: Avatar + Name/Role + StatusBadge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-11 w-11 border border-border/80 shadow-2xs shrink-0">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary">
                  {fullName}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {jobPosition}
                </p>
                <span className="text-[11px] text-muted-foreground/80 font-mono">
                  {employeeId}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Middle Meta Info */}
          <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{email}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2 truncate">
                <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                <span className="truncate">{phone}</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Department tag + Schedule */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
            <Badge
              variant="secondary"
              className="font-medium text-[11px] px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground"
            >
              {department}
            </Badge>

            <span className="text-[11px] text-muted-foreground truncate">
              {workSchedule}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
