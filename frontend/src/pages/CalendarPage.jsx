import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/common/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Briefcase,
  User,
  Filter,
  Loader2,
} from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'attendance' | 'leave'
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const today = () => {
    setCurrentDate(new Date());
  };

  // Helper date calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        setLoading(true);
        const startDateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const endDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

        const res = await api.get(`/calendar/events?start_date=${startDateStr}&end_date=${endDateStr}`);
        if (res.data?.success) {
          setEvents(res.data.data.events || []);
          setIsPrivileged(res.data.data.isPrivileged || false);
        }
      } catch (err) {
        console.error("Failed to load calendar events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();
  }, [month, year]);

  // Generate grid days
  const gridCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    gridCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    gridCells.push(day);
  }

  // Filter events for a given day
  const getDayEvents = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    return events.filter((ev) => {
      // 1. Filter by category dropdown
      if (filterType !== "all") {
        if (filterType === "attendance" && ev.type !== "attendance") return false;
        if (filterType === "leave" && ev.type !== "leave") return false;
        if (filterType === "green" && ev.colorCategory !== "green") return false;
        if (filterType === "yellow" && ev.colorCategory !== "yellow") return false;
        if (filterType === "red" && ev.colorCategory !== "red") return false;
        if (filterType === "blue" && ev.colorCategory !== "blue") return false;
      }

      // 2. Date matching
      if (ev.type === "attendance") {
        return ev.date === dateStr;
      }
      if (ev.type === "leave") {
        return dateStr >= ev.startDate && dateStr <= ev.endDate;
      }
      return false;
    });
  };

  const getBadgeStyle = (colorCategory) => {
    switch (colorCategory) {
      case "green":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300";
      case "yellow":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
      case "red":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300";
      case "blue":
        return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const isTodayDate = (day) => {
    if (!day) return false;
    const now = new Date();
    return (
      day === now.getDate() &&
      month === now.getMonth() &&
      year === now.getFullYear()
    );
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      <PageHeader
        title="Attendance & Leave Calendar"
        icon={CalendarIcon}
        subtitle={
          isPrivileged
            ? "Company-wide attendance status and approved leave calendar"
            : "Your personal color-coded attendance history and leave schedule"
        }
      />

      {/* Top Bar Navigation & Legend */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg border border-border hover:bg-muted text-foreground transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-foreground min-w-[160px] text-center">
              {monthName} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg border border-border hover:bg-muted text-foreground transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={today}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition ml-2"
            >
              Today
            </button>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-muted-foreground font-medium">Present (Full Day)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="text-muted-foreground font-medium">Half Day / Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="text-muted-foreground font-medium">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
              <span className="text-muted-foreground font-medium">Approved Leave</span>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="attendance">All Attendance</option>
              <option value="green">🟩 Present Only</option>
              <option value="yellow">🟨 Half Day Only</option>
              <option value="red">🟥 Absent Only</option>
              <option value="leave">🟦 Approved Leaves Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Calendar Grid */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Loading calendar events...</span>
            </div>
          ) : (
            <div>
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2.5">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60 bg-background">
                {gridCells.map((day, idx) => {
                  const dayEvents = getDayEvents(day);
                  const isToday = isTodayDate(day);

                  return (
                    <div
                      key={idx}
                      onClick={() => day && dayEvents.length > 0 && setSelectedDayEvents({ day, events: dayEvents })}
                      className={`min-h-[110px] p-1.5 transition ${
                        day ? "hover:bg-muted/30 cursor-pointer" : "bg-muted/10 cursor-default"
                      }`}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between px-1 mb-1">
                            <span
                              className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                                isToday
                                  ? "bg-primary text-primary-foreground"
                                  : "text-foreground/80"
                              }`}
                            >
                              {day}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                              </span>
                            )}
                          </div>

                          {/* Event Badges */}
                          <div className="space-y-1 max-h-[85px] overflow-y-auto pr-0.5">
                            {dayEvents.slice(0, 3).map((ev) => (
                              <div
                                key={ev.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-medium ${getBadgeStyle(
                                  ev.colorCategory
                                )}`}
                                title={ev.title}
                              >
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-[9px] text-primary font-bold pl-1">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Details Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-md w-full p-5 shadow-2xl border border-border space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Events for {monthName} {selectedDayEvents.day}, {year}
              </h3>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedDayEvents.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${getBadgeStyle(ev.colorCategory)}`}
                >
                  <p className="font-bold text-sm">{ev.title}</p>
                  {ev.type === "attendance" ? (
                    <p className="opacity-90">
                      Logged Hours: <span className="font-mono font-bold">{ev.hours} hrs</span>
                    </p>
                  ) : (
                    <p className="opacity-90">
                      Approved Leave Duration: <span className="font-semibold">{ev.startDate} to {ev.endDate}</span> ({ev.days} days)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
