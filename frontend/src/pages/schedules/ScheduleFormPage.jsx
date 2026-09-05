import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Clock,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Check,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import FormField from "../../components/common/FormField";
import EmptyState from "../../components/common/EmptyState";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import * as scheduleService from "../../services/scheduleService";
import {
  calculateDayHours,
  calculateWeeklyHours,
  formatHours,
} from "../../utils/scheduleCalculations";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const BREAK_OPTIONS = [
  { value: 0, label: "0 mins (No break)" },
  { value: 15, label: "15 mins" },
  { value: 30, label: "30 mins" },
  { value: 45, label: "45 mins" },
  { value: 60, label: "60 mins (1 hour)" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

function getInitialDaysState() {
  const state = {};
  DAYS_OF_WEEK.forEach((day) => {
    const isWeekend = day === "Saturday" || day === "Sunday";
    state[day] = {
      enabled: !isWeekend,
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: 60,
    };
  });
  return state;
}

export default function ScheduleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form Fields State
  const [name, setName] = useState("");
  const [company, setCompany] = useState("PeoplePay360 Pvt Ltd");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [status, setStatus] = useState("Active");
  const [daysState, setDaysState] = useState(getInitialDaysState);

  // UI & Loading States
  const [fetching, setFetching] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Field Validation Errors
  const [errors, setErrors] = useState({});

  // Fetch schedule details if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    setFetching(true);
    setFetchError(null);

    scheduleService
      .getScheduleById(id)
      .then((data) => {
        if (!isMounted) return;

        setName(data.name || "");
        setCompany(data.company || "PeoplePay360 Pvt Ltd");
        setTimezone(data.timezone || "Asia/Kolkata");
        setStatus(data.status || "Active");

        // Map weeklyPattern to daysState
        const updatedDaysState = {};
        const patternMap = new Map(
          (data.weeklyPattern || []).map((item) => [item.day, item])
        );

        DAYS_OF_WEEK.forEach((day) => {
          const entry = patternMap.get(day);
          if (entry) {
            updatedDaysState[day] = {
              enabled: true,
              startTime: entry.startTime || "09:00",
              endTime: entry.endTime || "18:00",
              breakMinutes: entry.breakMinutes != null ? entry.breakMinutes : 60,
            };
          } else {
            updatedDaysState[day] = {
              enabled: false,
              startTime: "09:00",
              endTime: "18:00",
              breakMinutes: 60,
            };
          }
        });

        setDaysState(updatedDaysState);
        setFetching(false);
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || "Schedule not found");
          setFetching(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Derived Active Weekly Pattern
  const activeWeeklyPattern = useMemo(() => {
    return DAYS_OF_WEEK.filter((day) => daysState[day]?.enabled).map((day) => ({
      day,
      startTime: daysState[day].startTime,
      endTime: daysState[day].endTime,
      breakMinutes: Number(daysState[day].breakMinutes),
    }));
  }, [daysState]);

  // Live Total Weekly Hours
  const totalWeeklyHours = useMemo(() => {
    return calculateWeeklyHours(activeWeeklyPattern);
  }, [activeWeeklyPattern]);

  // Toggle Day Enabled
  const handleToggleDay = (day) => {
    setDaysState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));

    // Clear day-specific error if toggled
    if (errors[`day_${day}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`day_${day}`];
        return next;
      });
    }
  };

  // Update Day Field (startTime, endTime, breakMinutes)
  const handleDayChange = (day, field, value) => {
    setDaysState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));

    if (errors[`day_${day}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`day_${day}`];
        return next;
      });
    }
  };

  // Form Submission Validation & Dispatch
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const newErrors = {};

    // Validate Name
    if (!name.trim()) {
      newErrors.name = "Schedule name is required";
    }

    // Validate Day Selection
    if (activeWeeklyPattern.length === 0) {
      newErrors.days = "At least one working day must be included in the schedule";
    }

    // Validate End Time > Start Time per included day
    DAYS_OF_WEEK.forEach((day) => {
      const dState = daysState[day];
      if (dState.enabled) {
        if (!dState.startTime || !dState.endTime) {
          newErrors[`day_${day}`] = "Start and end times are required";
        } else {
          const dayHours = calculateDayHours(
            dState.startTime,
            dState.endTime,
            dState.breakMinutes
          );
          if (dayHours <= 0) {
            newErrors[`day_${day}`] =
              "End time must be strictly after start time (accounting for break)";
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError("Please fix the validation errors before saving.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: name.trim(),
      company: company.trim() || "PeoplePay360 Pvt Ltd",
      timezone: timezone.trim() || "Asia/Kolkata",
      status,
      weeklyPattern: activeWeeklyPattern,
    };

    try {
      if (isEditMode) {
        await scheduleService.updateSchedule(id, payload);
      } else {
        await scheduleService.createSchedule(payload);
      }
      navigate("/schedules");
    } catch (err) {
      setSubmitError(err.message || "Failed to save schedule. Please try again.");
      setSubmitting(false);
    }
  };

  // Loading skeleton during fetch in edit mode
  if (fetching) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state if record not found
  if (isEditMode && fetchError) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/schedules")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Working Schedules
        </Button>
        <EmptyState
          icon={Clock}
          title="Schedule Not Found"
          description={fetchError}
          actionLabel="Back to Working Schedules"
          onAction={() => navigate("/schedules")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/schedules")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Working Schedules
        </Button>
      </div>

      <PageHeader
        title={isEditMode ? "Edit Schedule" : "New Working Schedule"}
        subtitle={
          isEditMode
            ? `Update settings and working pattern for ${name || "this schedule"}`
            : "Define daily start/end times and break durations for employee contracts"
        }
      />

      {/* Global Form Submission Error Banner */}
      {submitError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Error saving schedule</span>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* General Day Selection Error */}
      {errors.days && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errors.days}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              General Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <FormField
              label="Schedule Name"
              required
              error={errors.name}
              hint="e.g. 40 Hours / Week, Night Shift, Retail Weekend"
            >
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: null }));
                  }
                }}
                placeholder="Enter schedule name"
                className={errors.name ? "border-destructive" : ""}
              />
            </FormField>

            <FormField label="Company Name">
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </FormField>

            <FormField label="Timezone">
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Timezone (e.g. Asia/Kolkata)"
              />
            </FormField>

            <FormField label="Status">
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        {/* Section 2: Weekly Schedule Builder */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Weekly Working Pattern
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Toggle days to configure working hours
            </span>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 pt-2 pb-4">
            {DAYS_OF_WEEK.map((day) => {
              const dState = daysState[day];
              const isEnabled = dState.enabled;
              const dayHours = isEnabled
                ? calculateDayHours(
                    dState.startTime,
                    dState.endTime,
                    dState.breakMinutes
                  )
                : 0;
              const hasError = Boolean(errors[`day_${day}`]);

              return (
                <div key={day} className="py-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Day Checkbox & Name */}
                    <div className="flex items-center gap-3 w-36 shrink-0">
                      <label className="relative flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleToggleDay(day)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded border border-input peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors">
                          {isEnabled && (
                            <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />
                          )}
                        </div>
                      </label>
                      <span
                        className={`text-sm font-medium ${
                          isEnabled
                            ? "text-foreground"
                            : "text-muted-foreground line-through opacity-70"
                        }`}
                      >
                        {day}
                      </span>
                    </div>

                    {/* Enabled Controls / Disabled Off Day Readout */}
                    {isEnabled ? (
                      <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Start Time */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground font-medium">
                            Start:
                          </span>
                          <Input
                            type="time"
                            value={dState.startTime}
                            onChange={(e) =>
                              handleDayChange(day, "startTime", e.target.value)
                            }
                            className={`h-8 text-xs w-28 ${
                              hasError ? "border-destructive" : ""
                            }`}
                          />
                        </div>

                        {/* End Time */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground font-medium">
                            End:
                          </span>
                          <Input
                            type="time"
                            value={dState.endTime}
                            onChange={(e) =>
                              handleDayChange(day, "endTime", e.target.value)
                            }
                            className={`h-8 text-xs w-28 ${
                              hasError ? "border-destructive" : ""
                            }`}
                          />
                        </div>

                        {/* Break */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground font-medium">
                            Break:
                          </span>
                          <Select
                            value={String(dState.breakMinutes)}
                            onValueChange={(val) =>
                              handleDayChange(day, "breakMinutes", Number(val))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-36">
                              <SelectValue placeholder="Select break" />
                            </SelectTrigger>
                            <SelectContent>
                              {BREAK_OPTIONS.map((b) => (
                                <SelectItem
                                  key={b.value}
                                  value={String(b.value)}
                                  className="text-xs"
                                >
                                  {b.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Computed Daily Hours Readout */}
                        <div className="ml-auto text-xs font-semibold text-foreground px-2.5 py-1 rounded bg-muted/60 border border-border/50 shrink-0">
                          {formatHours(dayHours)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex justify-end">
                        <span className="text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded italic">
                          Off Day
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Day-specific validation error */}
                  {hasError && (
                    <p className="text-xs text-destructive pl-8 font-medium">
                      {errors[`day_${day}`]}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Total Weekly Hours Summary Line */}
            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between bg-primary/5 p-4 rounded-lg">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-foreground block">
                  Total Weekly Hours
                </span>
                <span className="text-xs text-muted-foreground">
                  Auto-computed across {activeWeeklyPattern.length} working{" "}
                  {activeWeeklyPattern.length === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="text-xl font-extrabold text-primary bg-background px-4 py-1.5 rounded-md border border-primary/20 shadow-xs">
                {formatHours(totalWeeklyHours)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/schedules")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? "Save Changes" : "Create Schedule"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
