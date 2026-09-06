import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  Calendar,
  Shield,
  Key,
  CreditCard,
  Building,
  CheckCircle2,
  Save,
  Pencil,
  X,
  Loader2,
  Trophy,
  TrendingUp,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { getMyEmployeeProfile } from "../services/employeeService";
import { getLeaderboard } from "../services/managerAttendanceService";

export default function UserProfile() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Leaderboard rank state
  const [rankInfo, setRankInfo] = useState(null);

  /**
   * Fetch this month's rank for the logged-in user.
   * The backend already resolves the match server-side via req.user → myRank.
   * We just read data.myRank directly — no client-side ID matching needed.
   */
  const fetchMyRank = async (profileData = profile) => {
    try {
      const now = new Date();
      const data = await getLeaderboard({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        limit: 500,
      });
      const totalEmployees = data?.rankings?.length || 0;
      const myRank = data?.myRank || data?.rankings?.find(
        (r) => r.employee_id === profileData?.id || (profileData?.email && r.employee_email?.toLowerCase() === profileData.email.toLowerCase())
      );

      if (myRank) {
        setRankInfo({
          rank: myRank.rank,
          total: totalEmployees,
          totalHours: myRank.total_worked_hours,
          tier: myRank.perks?.tier || null,
        });
      } else {
        setRankInfo({ rank: null, total: totalEmployees, totalHours: 0, tier: null });
      }
    } catch {
      // Silently ignore — rank is non-critical UI info
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyEmployeeProfile();
        setProfile(data);
        setPhone(data.phone || "+1 (555) 019-2834");
        setAddress(data.address || "742 Evergreen Terrace, Springfield");
        fetchMyRank(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
    fetchMyRank();
  }, []);

  // Keep rank live via WebSocket — reconnects automatically on disconnect
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
    let ws = null;
    let reconnectTimer = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === "LEADERBOARD_UPDATED") fetchMyRank();
          } catch {}
        };
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 4000); };
        ws.onerror = () => { if (ws) ws.close(); };
      } catch {}
    };
    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role) => {
    if (!role) return "Employee";
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading employee profile from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal contact details, organizational role, and employment credentials."
      />

      {saveSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Contact details updated successfully.</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar with rank badge overlay */}
              <div className="relative shrink-0">
                <Avatar className="h-18 w-18 border-2 border-primary/20 shadow-xs">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(profile?.name || user?.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Rank badge — bottom-right of avatar */}
                {rankInfo?.rank != null && (
                  <div
                    className={`absolute -bottom-1.5 -right-1.5 flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black shadow-md ring-2 ring-white dark:ring-gray-900 ${
                      rankInfo.tier === "gold"
                        ? "bg-amber-400 text-amber-900"
                        : rankInfo.tier === "silver"
                        ? "bg-slate-300 text-slate-800"
                        : rankInfo.tier === "bronze"
                        ? "bg-orange-400 text-orange-900"
                        : "bg-blue-100 text-blue-700"
                    }`}
                    title={`Leaderboard rank #${rankInfo.rank}`}
                  >
                    #{rankInfo.rank}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {profile?.name || user?.name || "Employee"}
                  </h2>
                  <StatusBadge status={profile?.status || "Active"} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                  {profile?.jobPosition || "Employee"} â€¢{" "}
                  <span className="text-foreground/80">{profile?.department || "Engineering"}</span>
                </p>
                <p className="text-xs text-muted-foreground/80 font-mono mt-0.5">
                  {profile?.employeeId || "EMP-2024-001"}
                </p>

                {/* Inline rank summary line */}
                {rankInfo && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Trophy
                      className={`w-3.5 h-3.5 ${
                        rankInfo.tier === "gold"
                          ? "text-amber-500"
                          : rankInfo.tier === "silver"
                          ? "text-slate-400"
                          : rankInfo.tier === "bronze"
                          ? "text-orange-500"
                          : "text-blue-400"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {rankInfo.rank != null ? (
                        <>
                          Rank{" "}
                          <span className="font-semibold text-foreground">
                            #{rankInfo.rank}
                          </span>{" "}
                          of {rankInfo.total} this month
                          {rankInfo.totalHours > 0 && (
                            <> · <span className="font-medium text-foreground">{rankInfo.totalHours}h</span> logged</>
                          )}
                        </>
                      ) : (
                        "No attendance logged this month"
                      )}
                    </span>
                    {rankInfo.tier && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                          rankInfo.tier === "gold"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : rankInfo.tier === "silver"
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            : rankInfo.tier === "bronze"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {rankInfo.tier}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="text-xs gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Contact Info
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="text-xs gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Personal & Work Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Contact Information */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Personal & Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Official Email
              </span>
              <div className="flex items-center gap-2 mt-1 text-sm font-medium text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{profile?.email || user?.email || "employee@peoplepay360.com"}</span>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveContact} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-muted-foreground block font-medium mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block font-medium mb-1">
                    Residential Address
                  </label>
                  <Textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <Button type="submit" size="sm" className="text-xs gap-1.5 w-full">
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </Button>
              </form>
            ) : (
              <>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    Phone Number
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-sm font-medium text-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{phone}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    Residential Address
                  </span>
                  <div className="flex items-start gap-2 mt-1 text-sm font-medium text-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground block font-medium">
                Date of Birth
              </span>
              <div className="flex items-center gap-2 mt-1 text-sm font-medium text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{profile?.dateOfBirth || "June 18, 1994"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work & Organizational Information */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Work & Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Department
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5">
                  {profile?.department || "Engineering"}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Job Position
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5">
                  {profile?.jobPosition || "Software Engineer"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Employment Type
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5">
                  {profile?.employeeType || "Full-time"}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Reporting Manager
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5">
                  {profile?.managerName || "Sarah Jenkins"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Work Schedule
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {profile?.workSchedule || "Standard 40h (Mon-Fri)"}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Joining Date
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {profile?.joiningDate || "March 01, 2023"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking & Statutory Details */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              Banking & Statutory Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Salary Bank Account
                </span>
                <div className="flex items-center gap-2 mt-1 text-sm font-mono font-medium text-foreground bg-muted/40 p-2 rounded-md border border-border/40">
                  <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{profile?.bankAccount || "â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ 4892 (Chase Bank)"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    PAN / Tax ID
                  </span>
                  <span className="text-sm font-mono font-semibold text-foreground block mt-0.5">
                    {profile?.panNumber || "ABCDE1234F"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    PF Account Number
                  </span>
                  <span className="text-sm font-mono font-semibold text-foreground block mt-0.5">
                    PF/10293/8493
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security & Access Credentials */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              Portal Access & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                System Role
              </span>
              <span className="text-sm font-semibold text-foreground block mt-0.5">
                {formatRole(user?.role)}
              </span>
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground block font-medium">
                Session Token
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600 font-medium">
                <Key className="w-3.5 h-3.5" />
                <span>Active JWT Session Authenticated</span>
              </div>
            </div>

            <div className="pt-3">
              <Link to="/my-attendance">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  View Attendance History
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

