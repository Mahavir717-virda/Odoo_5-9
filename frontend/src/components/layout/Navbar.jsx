import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPageTitle } from "../../utils/routeTitles";
import { PERMISSIONS } from "../../utils/permissions";
import PermissionGuard from "../common/PermissionGuard";
import api from "../../services/api";
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
  CheckCircle,
  Info,
} from "lucide-react";

export default function Navbar({ onMobileMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pageTitle = getPageTitle(location.pathname);

  // Fetch real user notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/me");
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // Fallback in case backend is offline
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Fast polling every 3 seconds for near-instant updates on local DB
      const interval = setInterval(fetchNotifications, 3000);

      // Instant refresh when user switches tabs or clicks into the app
      const onFocus = () => fetchNotifications();
      window.addEventListener("focus", onFocus);
      window.addEventListener("visibilitychange", () => {
        if (!document.hidden) fetchNotifications();
      });
      window.addEventListener("notifications-refresh", onFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("notifications-refresh", onFocus);
      };
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.patch(`/notifications/${notif.id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      }
      setShowNotifications(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {}
  };

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

  const getNotifIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    }
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
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-semibold text-sm text-gray-800 dark:text-gray-100 flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-normal text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all as read
                  </button>
                ) : (
                  <span className="text-xs font-normal text-gray-400">All caught up</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex gap-3 items-start cursor-pointer transition-colors ${
                        !n.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      {getNotifIcon(n.type)}
                      <div className="flex-1">
                        <p className={`text-xs ${!n.is_read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-gray-400 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                      )}
                    </div>
                  ))
                )}
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
