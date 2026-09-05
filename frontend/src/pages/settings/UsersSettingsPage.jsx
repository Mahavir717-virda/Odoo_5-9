import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Lock,
  Building2,
  Briefcase,
  X,
  Phone,
  UserCheck,
} from "lucide-react";
import {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  updateUserRole,
} from "../../services/settingsService";
import DataTable from "../../components/common/DataTable";

const STAGGER_CONTAINER_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const CARD_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

export default function UsersSettingsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "Engineering",
    jobPosition: "Software Engineer",
    phone: "",
  });

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    department: "",
    jobPosition: "",
    phone: "",
    status: "Active",
    role: "EMPLOYEE",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listUsers({
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err.response?.data?.message || "Failed to load system users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError("Please fill out all required fields.");
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError("");
      await createUser(createForm);
      setIsCreateOpen(false);
      setSuccessMsg(`User account for ${createForm.email} created successfully.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        department: "Engineering",
        jobPosition: "Software Engineer",
        phone: "",
      });
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to register user account.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      department: user.department,
      jobPosition: user.jobPosition,
      phone: user.phone !== "â€”" ? user.phone : "",
      status: user.status,
      role: user.role,
    });
    setEditError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditSubmitting(true);
      setEditError("");

      // Update employee profile fields
      await updateUser(editingUser.id, editForm);

      // Update security role if it changed
      if (editForm.role !== editingUser.role) {
        await updateUserRole(editingUser.userId, editForm.role);
      }

      setEditingUser(null);
      setSuccessMsg(`User ${editForm.name} updated successfully.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleStatusToggle = async (user) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    if (!window.confirm(`Are you sure you want to mark ${user.name} as ${nextStatus}?`)) return;

    try {
      await toggleUserStatus(user.id, nextStatus);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle user status.");
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.employeeCode.toLowerCase().includes(term) ||
      u.department.toLowerCase().includes(term)
    );
  });

  // KPI Calculations
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === "Active").length;
  const adminCount = users.filter((u) => u.role === "ADMIN" || u.role.includes("MANAGER")).length;
  const employeeCount = users.filter((u) => u.role === "EMPLOYEE" || u.role === "HR_PAYROLL_USER").length;

  const getRoleBadge = (role) => {
    const r = (role || "").toUpperCase();
    if (r === "ADMIN") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Admin
        </span>
      );
    }
    if (r === "HR_PAYROLL_MANAGER") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Payroll Manager
        </span>
      );
    }
    if (r === "HR_PAYROLL_USER") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6f2fd] text-[#6334b8] border border-[#ddcef7]">
          Payroll User
        </span>
      );
    }
    if (r === "HR_MANAGER") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          HR Manager
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        Employee
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f6f2fd] text-[#6334b8] border border-indigo-100">
              {totalCount} Accounts
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administer system credentials, assign security roles, and manage employee accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#7743db]" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#7743db] hover:bg-[#6334b8] text-white shadow-sm shadow-indigo-200 transition"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        </div>
      </div>

      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Database credentials</p>
          </div>
          <div className="p-3 bg-[#f6f2fd] rounded-xl text-[#7743db]">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Status</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Authenticated logins</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Admin & Managers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{adminCount}</h3>
            <p className="text-xs text-purple-600 mt-0.5">Elevated privileges</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={CARD_ANIMATION_VARIANTS} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Staff Members</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{employeeCount}</h3>
            <p className="text-xs text-blue-600 mt-0.5">Self-Service Users</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>
      </motion.div>

      {/* Action Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="HR_PAYROLL_MANAGER">Payroll Manager</option>
            <option value="HR_PAYROLL_USER">Payroll User</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db] text-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={[
          {
            key: "name",
            header: "User / Identity",
            sortable: true,
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ede5fb] text-[#7743db] font-semibold text-xs flex items-center justify-center shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "employeeCode",
            header: "Employee ID",
            sortable: true,
            render: (u) => (
              <span className="font-mono text-xs font-medium text-slate-600">
                {u.employeeCode}
              </span>
            ),
          },
          {
            key: "department",
            header: "Department & Position",
            sortable: true,
            render: (u) => (
              <div>
                <p className="font-medium text-slate-900 text-xs">{u.jobPosition}</p>
                <p className="text-[11px] text-slate-400">{u.department}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Security Role",
            sortable: true,
            render: (u) => getRoleBadge(u.role),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            align: "center",
            render: (u) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusToggle(u);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                  u.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
                title="Click to toggle status"
              >
                {u.status === "Active" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                {u.status}
              </button>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (u) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(u);
                }}
                className="p-1.5 rounded-lg text-slate-600 hover:text-[#7743db] hover:bg-slate-100 transition"
                title="Edit User"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ),
          },
        ]}
        data={filteredUsers}
        loading={loading}
        error={error}
        onRetry={fetchUsers}
        emptyState={{
          icon: Users,
          title: "No users found",
          description:
            search || roleFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search filters."
              : "Create user credentials to allow staff members to log in.",
        }}
      />

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create System User</h3>
                <p className="text-xs text-slate-500">Register login credentials and assign security permissions</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. eleanor.vance@company.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  >
                    <option value="EMPLOYEE">Employee (Self-Service)</option>
                    <option value="HR_PAYROLL_USER">HR Payroll User</option>
                    <option value="HR_PAYROLL_MANAGER">HR Payroll Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Position
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Payroll Analyst"
                    value={createForm.jobPosition}
                    onChange={(e) => setCreateForm({ ...createForm, jobPosition: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#7743db] hover:bg-[#6334b8] text-white shadow-sm shadow-indigo-200 transition disabled:opacity-50"
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit User Profile</h3>
                <p className="text-xs text-slate-500 font-mono">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Position
                  </label>
                  <input
                    type="text"
                    value={editForm.jobPosition}
                    onChange={(e) => setEditForm({ ...editForm, jobPosition: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7743db]/20 focus:border-[#7743db]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Security Role â€” Admin-Only Change */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <label className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                    Security Role
                  </label>
                </div>
                <p className="text-[11px] text-amber-700/70 mb-3">
                  Changing the security role immediately updates the user's access permissions across the entire platform.
                </p>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"
                >
                  <option value="EMPLOYEE">ðŸ‘¤ Employee (Self-Service Portal)</option>
                  <option value="HR_PAYROLL_USER">ðŸ“‹ HR Payroll User</option>
                  <option value="HR_PAYROLL_MANAGER">ðŸ’¼ HR Payroll Manager</option>
                  <option value="HR_MANAGER">ðŸ¢ HR Manager</option>
                  <option value="ADMIN">ðŸ›¡ï¸ Administrator (Full Access)</option>
                </select>
                {editForm.role !== editingUser?.role && (
                  <p className="mt-2 text-[11px] text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Role will change from <strong>{editingUser?.role}</strong> â†’ <strong>{editForm.role}</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#7743db] hover:bg-[#6334b8] text-white shadow-sm shadow-indigo-200 transition disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

