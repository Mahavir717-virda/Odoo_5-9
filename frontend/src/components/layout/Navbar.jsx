import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPageTitle } from "../../utils/routeTitles";
import { PERMISSIONS } from "../../utils/permissions";
import PermissionGuard from "../common/PermissionGuard";
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  AlertTriangle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Navbar({ onMobileMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role) => {
    if (!role) return "User";
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setShowProfileMenu(false);
      navigate("/login");
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Hamburger button + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {pageTitle}
        </h1>
      </div>

      {/* Right side: Search, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative hidden sm:block w-48 md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees, contracts..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-transparent rounded-md focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-semibold text-sm text-gray-800 dark:text-gray-100 flex justify-between items-center">
                <span>Notifications</span>
                <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                  4 new
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex gap-3 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-800 dark:text-gray-200">Payroll requires validation</p>
                    <span className="text-[10px] text-gray-400">2h ago</span>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex gap-3 items-start">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-800 dark:text-gray-200">Leave request pending approval</p>
                    <span className="text-[10px] text-gray-400">3h ago</span>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-800 dark:text-gray-200">Contract expiring soon</p>
                    <span className="text-[10px] text-gray-400">1d ago</span>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-800 dark:text-gray-200">Missing employee bank information</p>
                    <span className="text-[10px] text-gray-400">2d ago</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-center">
                <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  View all notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-medium text-xs flex items-center justify-center">
              {getInitials(user?.name)}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block pr-1">
              {user?.name || "User"}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded">
                  {formatRole(user?.role)}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>

                <PermissionGuard
                  anyOf={[
                    PERMISSIONS.SETTINGS.MANAGE_USERS,
                    PERMISSIONS.SETTINGS.MANAGE_ROLES,
                    PERMISSIONS.SETTINGS.MANAGE_SYSTEM,
                  ]}
                >
                  <Link
                    to="/settings/users"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </PermissionGuard>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
