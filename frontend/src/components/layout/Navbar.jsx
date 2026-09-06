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
        return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />;
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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">
          {pageTitle}
        </h1>
      </div>

      {/* Right side: Search, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative hidden sm:block w-44 md:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-100/80 border border-slate-200 rounded-lg focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[9px] font-bold bg-teal-600 text-white rounded-full flex items-center justify-center leading-none shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-0 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80">
                <span className="font-semibold text-sm text-slate-900">Notifications</span>
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">All caught up</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 hover:bg-slate-50 flex gap-3 items-start cursor-pointer transition-colors ${
                        !n.is_read ? "bg-teal-50/40" : ""
                      }`}
                    >
                      {getNotifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.is_read ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0"></span>
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
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{formatRole(user?.role)}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-0 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-800 rounded-full border border-teal-200">
                  {formatRole(user?.role)}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
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
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </Link>
                </PermissionGuard>
              </div>

              <div className="border-t border-slate-200 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
