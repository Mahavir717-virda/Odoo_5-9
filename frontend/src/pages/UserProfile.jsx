import { useState } from "react";
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
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export default function UserProfile() {
  const { user } = useAuth();

  // Local editable state for personal contact info
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [address, setAddress] = useState("452 Innovation Blvd, Suite 300, Austin, TX 78701");
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal contact details, organizational role, and employment credentials."
      />

      {saveSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Contact details updated successfully.</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-18 w-18 border-2 border-primary/20 shadow-xs shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {user?.name || "Employee"}
                  </h2>
                  <StatusBadge status="Active" />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                  {formatRole(user?.role)} •{" "}
                  <span className="text-foreground/80">Engineering</span>
                </p>
                <p className="text-xs text-muted-foreground/80 font-mono mt-0.5">
                  EMP-2024-007
                </p>
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
        <Card className="border-border bg-card shadow-xs">
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
                <span>{user?.email || "employee@peoplepay360.com"}</span>
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
                <span>August 14, 1994</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work & Organizational Information */}
        <Card className="border-border bg-card shadow-xs">
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
                  Engineering
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Job Position
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5">
                  Frontend Developer
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Reporting Manager
                </span>
                <span className="text-sm font-medium text-foreground block mt-0.5">
                  Marcus Vance (VP Eng)
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Employment Type
                </span>
                <span className="text-sm font-medium text-foreground block mt-0.5">
                  Full-time (Regular)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Work Schedule
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-sm font-medium text-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>40 Hours / Week</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Date of Joining
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-sm font-medium text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>September 01, 2022</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank & Security Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank & Salary Account */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              Salary & Disbursement Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Bank Name
                </span>
                <span className="text-sm font-semibold text-foreground">HDFC Bank</span>
              </div>
              <Building className="w-5 h-5 text-muted-foreground/60" />
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground block font-medium">
                Account Number
              </span>
              <span className="text-sm font-mono font-medium text-foreground">
                XXXX-XXXX-4819
              </span>
            </div>

            <div className="pt-2 border-t border-border/40 flex justify-between items-center">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  IFSC Code
                </span>
                <span className="text-sm font-mono font-medium text-foreground">
                  HDFC0001234
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Disbursement
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  Direct Transfer
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Authentication */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Security & Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Password
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last changed 45 days ago. Regular password rotation is recommended.
              </p>
              <div className="mt-2.5">
                <Link to="/change-password">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Change Password
                  </Button>
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground block font-medium">
                Active Session
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Logged in on Web Browser • Current IP verified
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
