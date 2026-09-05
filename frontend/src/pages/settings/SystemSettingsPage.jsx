import React, { useState, useEffect } from "react";
import {
  Building2,
  DollarSign,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  Clock,
  Lock,
  Mail,
  Sliders,
} from "lucide-react";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../services/settingsService";

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState("company"); // 'company' | 'payroll' | 'security' | 'notifications'
  const [settings, setSettings] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = getSystemSettings();
    setSettings(current);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    updateSystemSettings(settings);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }, 400);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              Enterprise Configuration
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global company profile, localization parameters, payroll automation, and security policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving Changes..." : "Save Settings"}
        </button>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>System configuration parameters updated and applied successfully.</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <button
          onClick={() => setActiveTab("company")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "company"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company & Localization
        </button>

        <button
          onClick={() => setActiveTab("payroll")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "payroll"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Payroll & Shifts
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "security"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <Shield className="w-4 h-4" />
          Security & Access
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "notifications"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications & Alerts
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* TAB 1: Company Profile & Localization */}
        {activeTab === "company" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Company Information & Branding
              </h3>
              <p className="text-xs text-slate-500">
                Primary business identification and official corporate credentials
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operating Brand Name
                </label>
                <input
                  type="text"
                  value={settings.company.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, name: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={settings.company.legalName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, legalName: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax Registration ID / EIN
                </label>
                <input
                  type="text"
                  value={settings.company.taxId}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, taxId: e.target.value },
                    })
                  }
                  className="w-full font-mono px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Support Email
                </label>
                <input
                  type="email"
                  value={settings.company.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, email: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Headquarters Physical Address
                </label>
                <input
                  type="text"
                  value={settings.company.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, address: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Localization & Regional Standards
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency Symbol
                  </label>
                  <select
                    value={settings.company.currency}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, currency: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Timezone
                  </label>
                  <input
                    type="text"
                    value={settings.company.timezone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, timezone: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fiscal Year Start Month
                  </label>
                  <select
                    value={settings.company.fiscalYearStart}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, fiscalYearStart: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="January">January</option>
                    <option value="April">April</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Payroll & Shift Parameters */}
        {activeTab === "payroll" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Payroll Cycle & Time Tracking Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Configure work schedules, overtime thresholds, and automated payrun cutoffs
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Work Hours / Day
                </label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={settings.payroll.workHoursPerDay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payroll: { ...settings.payroll, workHoursPerDay: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Days / Week
                </label>
                <input
                  type="number"
                  min="3"
                  max="7"
                  value={settings.payroll.workDaysPerWeek}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payroll: { ...settings.payroll, workDaysPerWeek: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Payrun Cutoff Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.payroll.cutoffDayOfMonth}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payroll: { ...settings.payroll, cutoffDayOfMonth: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Overtime Rate Multiplier (x Base Rate)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={settings.payroll.overtimeRateMultiplier}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payroll: {
                        ...settings.payroll,
                        overtimeRateMultiplier: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payroll.autoCalculateTax}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payroll: { ...settings.payroll, autoCalculateTax: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Automatically calculate tax withholdings and deductions during payrun computation
                </span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: Security & Session Policies */}
        {activeTab === "security" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Authentication & Account Security
              </h3>
              <p className="text-xs text-slate-500">
                Configure credential standards, JWT session expiry, and login policies
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  JWT Session Lifetime (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.security.sessionTimeoutHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        sessionTimeoutHours: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={settings.security.minPasswordLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        minPasswordLength: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.requireSpecialChars}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, requireSpecialChars: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Require special characters & numbers in user passwords
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.mfaEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, mfaEnabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Enable Multi-Factor Authentication (MFA / 2FA) requirement for administrative roles
                </span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: Notifications & Automated Alerts */}
        {activeTab === "notifications" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Email Dispatch & Automated Notifications
              </h3>
              <p className="text-xs text-slate-500">
                Configure event triggers for system emails, approvals, and alert dispatches
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Email Payslip on Payrun Completion
                  </p>
                  <p className="text-xs text-slate-500">
                    Automatically send PDF payslips to employee registered email addresses
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailOnPayrunComputed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        emailOnPayrunComputed: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Instant Leave Request Alerts
                  </p>
                  <p className="text-xs text-slate-500">
                    Notify managers immediately when staff submit time off requests
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailOnLeaveApproved}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        emailOnLeaveApproved: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Attendance Anomaly Notifications
                  </p>
                  <p className="text-xs text-slate-500">
                    Alert supervisors when an employee misses check-out or arrives late
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailOnAttendanceAnomaly}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        emailOnAttendanceAnomaly: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
