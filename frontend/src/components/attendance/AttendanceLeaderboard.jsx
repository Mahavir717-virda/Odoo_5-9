import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Sparkles,
  Flame,
  Clock,
  Calendar,
  Building2,
  ChevronRight,
  TrendingUp,
  Gift,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
  Search,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import * as managerAttendanceService from "../../services/managerAttendanceService";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function AttendanceLeaderboard({ showHeader = true }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [selectedDept, setSelectedDept] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [showPerksInfo, setShowPerksInfo] = useState(false);

  const [isWsConnected, setIsWsConnected] = useState(false);

  const fetchLeaderboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await managerAttendanceService.getLeaderboard({
        month: selectedMonth,
        year: selectedYear,
        department: selectedDept,
        limit: 500,
      });
      setLeaderboardData(data);
    } catch (err) {
      console.error("Failed to load attendance leaderboard:", err);
      if (!isBackground) setError(err.message || "Failed to load leaderboard data");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Establish clean WebSocket connection for live leaderboard updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;

    let ws = null;
    let reconnectTimeout = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "LEADERBOARD_UPDATED") {
              // Real-time broadcast received: refresh leaderboard instantly in background!
              fetchLeaderboard(true);
            }
          } catch (e) {
            // ignore
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
          if (ws) ws.close();
        };
      } catch (e) {
        setIsWsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [selectedMonth, selectedYear, selectedDept]);

  const {
    rankings = [],
    top3 = [],
    departmentStandings = [],
    stats,
    periodName,
    myRank,
    myDepartment,
    myDepartmentRank,
    availableDepartments = [],
  } = leaderboardData || {};

  const filteredRankings = rankings.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.employee_name?.toLowerCase().includes(term) ||
      item.department?.toLowerCase().includes(term) ||
      item.job_position?.toLowerCase().includes(term)
    );
  });

  // Dynamic department tabs including "All Company" + "My Department" + other active departments
  const allDeptNames = Array.from(
    new Set([
      ...(myDepartment ? [myDepartment] : []),
      ...availableDepartments,
      "Engineering",
      "HR",
      "Finance",
      "Sales",
      "Marketing",
    ])
  ).filter(Boolean);

  const DEPARTMENT_TABS = [
    { id: "all", label: "🏢 All Company", isMyDept: false },
    ...(myDepartment
      ? [
          {
            id: myDepartment,
            label: `⭐ My Dept (${myDepartment})`,
            isMyDept: true,
          },
        ]
      : []),
    ...allDeptNames
      .filter((d) => d !== myDepartment)
      .map((d) => ({
        id: d,
        label: `${d}`,
        isMyDept: false,
      })),
  ];

  // Podium sorting: 2nd (Silver, index 1), 1st (Gold, index 0), 3rd (Bronze, index 2)
  const first = top3[0] || null;
  const second = top3[1] || null;
  const third = top3[2] || null;

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-[#C3ACD0]/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7743DB] to-[#9667E0] flex items-center justify-center text-white shadow-md shadow-[#7743DB]/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1F1728]">
                Attendance Champions & Perks
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isWsConnected
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWsConnected ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                  }`}
                />
                {isWsConnected ? "LIVE WEBSOCKET" : "SYNCED"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Recognizing top performers in {selectedDept === "all" ? "the whole organization" : selectedDept} for {periodName || "this month"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px] h-9 border-[#C3ACD0]/40 bg-[#FFFBF5] text-xs font-semibold">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Selector */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[95px] h-9 border-[#C3ACD0]/40 bg-[#FFFBF5] text-xs font-semibold">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026" className="text-xs">2026</SelectItem>
              <SelectItem value="2025" className="text-xs">2025</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPerksInfo(!showPerksInfo)}
            className="h-9 border-[#7743DB]/30 text-[#7743DB] hover:bg-[#7743DB]/10 text-xs font-semibold gap-1.5"
          >
            <Gift className="w-3.5 h-3.5" />
            Perks Ladder
          </Button>
        </div>
      </div>

      {/* Department Quick Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {DEPARTMENT_TABS.map((dept) => {
          const isSelected = selectedDept === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs ${
                isSelected
                  ? "bg-[#7743DB] text-white shadow-md shadow-[#7743DB]/20 scale-102"
                  : dept.isMyDept
                  ? "bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100"
                  : "bg-white text-slate-600 border border-[#C3ACD0]/30 hover:bg-[#FFFBF5] hover:text-slate-900"
              }`}
            >
              <span>{dept.label}</span>
            </button>
          );
        })}
      </div>

      {/* Inter-Department Competition Battle Scoreboard (when viewing All Company) */}
      {selectedDept === "all" && departmentStandings.length > 0 && (
        <Card className="border border-[#7743DB]/30 bg-gradient-to-r from-[#FFFBF5] via-white to-[#F7EFE5] shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-[#C3ACD0]/20 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-[#1F1728] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#7743DB]" />
              Inter-Department Championship Standings
            </CardTitle>
            <span className="text-[11px] font-semibold text-slate-500">
              Ranked by Avg Hours / Member
            </span>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {departmentStandings.map((dept, idx) => {
                const isLeading = idx === 0;
                return (
                  <div
                    key={dept.department}
                    onClick={() => setSelectedDept(dept.department)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      isLeading
                        ? "bg-amber-500/10 border-amber-300 shadow-xs"
                        : "bg-white/80 border-slate-200 hover:border-[#7743DB]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {isLeading ? "🏆 #1" : `#${dept.rank}`} {dept.department}
                      </span>
                      <span className="text-[11px] font-bold text-[#7743DB]">
                        {dept.avg_hours_per_member}h <span className="text-[10px] font-normal text-slate-500">/ avg</span>
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{dept.total_members} members</span>
                      <span>{dept.total_department_hours}h total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perks Explanation Modal / Expandable Card */}
      {showPerksInfo && (
        <Card className="border border-[#7743DB]/30 bg-gradient-to-br from-[#FFFBF5] to-[#F7EFE5] shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3 border-b border-[#C3ACD0]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#7743DB]" />
                <CardTitle className="text-base font-bold text-[#1F1728]">
                  Monthly Attendance Perks & Rewards Policy
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPerksInfo(false)}
                className="h-7 text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-300/40 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                Rank 1: Champion Tier
              </div>
              <p className="text-slate-600 font-semibold">$150 Monthly Cash Bonus</p>
              <p className="text-slate-500 text-[11px]">+ 1 Extra Floating Paid Day Off</p>
              <p className="text-slate-500 text-[11px]">+ Executive Spotlight on Portal</p>
            </div>

            <div className="p-3 bg-slate-400/10 border border-slate-300 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Medal className="w-4 h-4 text-slate-400" />
                Rank 2: Silver Pillar
              </div>
              <p className="text-slate-600 font-semibold">$100 Monthly Cash Bonus</p>
              <p className="text-slate-500 text-[11px]">+ Team Lunch & Coffee Voucher</p>
            </div>

            <div className="p-3 bg-amber-700/10 border border-amber-600/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Award className="w-4 h-4 text-amber-700" />
                Rank 3: Bronze Vanguard
              </div>
              <p className="text-slate-600 font-semibold">$50 Perk Voucher</p>
              <p className="text-slate-500 text-[11px]">+ Wellness & Beverage Perk</p>
            </div>

            <div className="p-3 bg-[#7743DB]/10 border border-[#7743DB]/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#7743DB]">
                <Sparkles className="w-4 h-4" />
                Rank 4–10: Star Contributors
              </div>
              <p className="text-slate-600 font-semibold">250 Reward Points</p>
              <p className="text-slate-500 text-[11px]">+ Certificate of Attendance Commendation</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-600 text-sm">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Top 3 3D-Style Podium */}
          {rankings.length > 0 ? (
            <div className="relative py-4 px-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
                {/* 2nd Place (Silver) */}
                {second && (
                  <div className="order-2 md:order-1 flex flex-col items-center bg-white/90 backdrop-blur-sm border-2 border-slate-300 rounded-2xl p-5 shadow-lg relative transition-all hover:scale-[1.02]">
                    <div className="absolute -top-4 px-3 py-0.5 bg-slate-500 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                      <Medal className="w-3.5 h-3.5" /> 2nd Place
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-700 shadow-inner mt-2">
                      {second.avatar_url ? (
                        <img src={second.avatar_url} alt={second.employee_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{second.employee_name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="mt-3 font-bold text-sm text-[#1F1728] text-center line-clamp-1">
                      {second.employee_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-2">{second.department}</p>
                    
                    <div className="w-full bg-[#F7EFE5] rounded-xl p-2.5 text-center my-2 space-y-1">
                      <div className="text-xl font-black text-slate-700">
                        {second.total_worked_hours} <span className="text-xs font-normal text-slate-500">hrs</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {second.days_present} days logged • {second.punctuality_rate}% on-time
                      </div>
                    </div>

                    <div className="text-center w-full px-2 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200">
                      🥈 {second.perks.perkText}
                    </div>
                  </div>
                )}

                {/* 1st Place (Gold - Tallest Center) */}
                {first && (
                  <div className="order-1 md:order-2 flex flex-col items-center bg-gradient-to-b from-amber-50/90 to-white border-2 border-amber-400 rounded-2xl p-6 shadow-xl relative transition-all hover:scale-[1.03] -mt-2">
                    <div className="absolute -top-5 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full text-xs font-black shadow-lg flex items-center gap-1.5 tracking-wider uppercase">
                      <Crown className="w-4 h-4 fill-white text-white" /> Champion
                    </div>
                    
                    <div className="relative mt-2">
                      <div className="w-20 h-20 rounded-full border-4 border-amber-400 overflow-hidden bg-amber-100 flex items-center justify-center text-2xl font-black text-amber-700 shadow-md">
                        {first.avatar_url ? (
                          <img src={first.avatar_url} alt={first.employee_name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{first.employee_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow">
                        <Flame className="w-3.5 h-3.5 fill-white" />
                      </div>
                    </div>

                    <h3 className="mt-3 font-extrabold text-base text-[#1F1728] text-center line-clamp-1">
                      {first.employee_name}
                    </h3>
                    <p className="text-xs text-amber-800 font-medium mb-2">{first.job_position} • {first.department}</p>
                    
                    <div className="w-full bg-amber-100/70 border border-amber-200 rounded-xl p-3 text-center my-2 space-y-1 shadow-inner">
                      <div className="text-2xl font-black text-amber-900">
                        {first.total_worked_hours} <span className="text-xs font-medium text-amber-700">hrs logged</span>
                      </div>
                      <div className="text-xs text-amber-800 font-semibold">
                        {first.days_present} active days • {first.punctuality_rate}% punctuality
                      </div>
                    </div>

                    <div className="text-center w-full px-2.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20">
                      👑 {first.perks.perkText}
                    </div>
                  </div>
                )}

                {/* 3rd Place (Bronze) */}
                {third && (
                  <div className="order-3 flex flex-col items-center bg-white/90 backdrop-blur-sm border-2 border-amber-700/30 rounded-2xl p-5 shadow-lg relative transition-all hover:scale-[1.02]">
                    <div className="absolute -top-4 px-3 py-0.5 bg-amber-800 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> 3rd Place
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-amber-700/40 overflow-hidden bg-amber-50 flex items-center justify-center text-xl font-bold text-amber-900 shadow-inner mt-2">
                      {third.avatar_url ? (
                        <img src={third.avatar_url} alt={third.employee_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{third.employee_name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="mt-3 font-bold text-sm text-[#1F1728] text-center line-clamp-1">
                      {third.employee_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-2">{third.department}</p>
                    
                    <div className="w-full bg-[#F7EFE5] rounded-xl p-2.5 text-center my-2 space-y-1">
                      <div className="text-xl font-black text-amber-900">
                        {third.total_worked_hours} <span className="text-xs font-normal text-slate-500">hrs</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {third.days_present} days logged • {third.punctuality_rate}% on-time
                      </div>
                    </div>

                    <div className="text-center w-full px-2 py-1.5 bg-amber-100/70 text-amber-900 rounded-lg text-[11px] font-semibold border border-amber-200">
                      🥉 {third.perks.perkText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-[#C3ACD0]/30 rounded-2xl text-center">
              <Calendar className="w-10 h-10 mx-auto text-[#C3ACD0] mb-2" />
              <h3 className="text-base font-bold text-slate-700">No attendance records found</h3>
              <p className="text-xs text-slate-500 mt-1">
                No employees have logged attendance for {periodName || "this period"}.
              </p>
            </div>
          )}

          {/* User's Personal Standing (if authenticated) */}
          {myRank && (
            <div className="bg-gradient-to-r from-[#7743DB] to-[#9667E0] text-white p-4 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl border border-white/30">
                  #{myRank.rank}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Your Current Standing ({selectedDept === "all" ? "Organization-Wide" : selectedDept})
                  </div>
                  <div className="text-base font-bold text-white">
                    {myRank.employee_name} ({myRank.perks.title})
                  </div>
                  {myDepartment && myDepartmentRank && selectedDept === "all" && (
                    <div className="text-xs text-amber-200 font-semibold mt-0.5">
                      🏅 #{myDepartmentRank} in {myDepartment}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-center">
                <div className="px-3 py-1 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-lg font-black">{myRank.total_worked_hours}h</div>
                  <div className="text-[10px] text-white/80">Hours Logged</div>
                </div>
                <div className="px-3 py-1 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-lg font-black">{myRank.days_present}</div>
                  <div className="text-[10px] text-white/80">Days Present</div>
                </div>
                <div className="px-3 py-1 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-lg font-black">{myRank.punctuality_rate}%</div>
                  <div className="text-[10px] text-white/80">Punctuality</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white text-[#7743DB] shadow-sm">
                  {myRank.perks.badge}
                </span>

                {myDepartment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDept(selectedDept === myDepartment ? "all" : myDepartment)}
                    className="h-7 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border-white/30"
                  >
                    {selectedDept === myDepartment ? "View All Company" : `View ${myDepartment} Only`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Full Ranked Table */}
          <Card className="border border-[#C3ACD0]/30 shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base font-bold text-[#1F1728] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7743DB]" />
                Complete Monthly Rankings ({filteredRankings.length} Employees)
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search employee or dept..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs border-slate-200"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFFBF5] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Total Hours</th>
                    <th className="py-3 px-4 text-center">Days Present</th>
                    <th className="py-3 px-4 text-center">Punctuality</th>
                    <th className="py-3 px-4">Awarded Perk / Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRankings.map((emp) => {
                    const isTop1 = emp.rank === 1;
                    const isTop2 = emp.rank === 2;
                    const isTop3 = emp.rank === 3;

                    return (
                      <tr
                        key={emp.employee_id}
                        className={`hover:bg-[#FFFBF5]/70 transition-colors ${
                          emp.employee_id === myRank?.employee_id ? "bg-[#7743DB]/5 font-semibold" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {isTop1 && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white font-black shadow-sm">
                              1
                            </span>
                          )}
                          {isTop2 && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400 text-white font-black shadow-sm">
                              2
                            </span>
                          )}
                          {isTop3 && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black shadow-sm">
                              3
                            </span>
                          )}
                          {!isTop1 && !isTop2 && !isTop3 && (
                            <span className="text-slate-500 font-bold">#{emp.rank}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#F7EFE5] border border-[#C3ACD0]/40 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {emp.employee_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{emp.employee_name}</div>
                              <div className="text-[11px] text-slate-500">{emp.job_position || "Staff"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                            {emp.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black text-slate-800 text-sm">{emp.total_worked_hours}</span>
                          <span className="text-[10px] text-slate-500 ml-0.5">hrs</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-700 font-medium">
                          {emp.days_present} <span className="text-slate-400 text-[11px]">days</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              emp.punctuality_rate >= 95
                                ? "bg-emerald-100 text-emerald-800"
                                : emp.punctuality_rate >= 80
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {emp.punctuality_rate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              backgroundColor: `${emp.perks.color}15`,
                              color: emp.perks.color,
                              border: `1px solid ${emp.perks.color}40`,
                            }}
                          >
                            {emp.perks.badge}
                          </span>
                          <span className="hidden lg:inline text-[11px] text-slate-500 ml-2">
                            {emp.perks.title}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
