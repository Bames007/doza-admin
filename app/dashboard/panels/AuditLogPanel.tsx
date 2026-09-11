// app/dashboard/components/panels/admin/AuditLogsPanel.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  RefreshCw,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  Users,
  Package,
  FileText,
  CreditCard,
  Settings,
  Calendar,
  X,
  ChevronRight,
  Globe,
  Smartphone,
  Monitor,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useDashboard } from "../DashboardContext";
import { apiFetch } from "@/app/lib/api";

// ─── Types ────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: "success" | "failure";
}

// ─── Helper Components ──────────────────────────────────────────────

const ActionIcon = ({ action }: { action: string }) => {
  const iconMap: Record<string, any> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    view: Eye,
    login: User,
    logout: User,
    export: Download,
    import: (props: any) => (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  };
  const Icon = iconMap[action] || MoreVertical;
  return <Icon className="w-4 h-4" />;
};

const ResourceIcon = ({ resource }: { resource: string }) => {
  const iconMap: Record<string, any> = {
    patient: Users,
    user: User,
    appointment: Calendar,
    inventory: Package,
    prescription: FileText,
    billing: CreditCard,
    settings: Settings,
    center: Users,
    medic: User,
    subscription: CreditCard,
  };
  const Icon = iconMap[resource] || FileText;
  return <Icon className="w-4 h-4" />;
};

const StatusBadge = ({ status }: { status?: string }) => {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    success: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle,
    },
    failure: { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
  };
  const normalizedStatus = status?.toLowerCase() || "unknown";
  const {
    bg,
    text,
    icon: Icon,
  } = config[normalizedStatus] || {
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: AlertCircle,
  };
  const displayLabel =
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
        bg,
        text,
      )}
    >
      <Icon className="w-3 h-3" />
      {displayLabel}
    </span>
  );
};

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getDeviceIcon = (userAgent: string) => {
  if (!userAgent) return <Monitor className="w-4 h-4" />;
  const ua = userAgent.toLowerCase();
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return <Smartphone className="w-4 h-4" />;
  }
  return <Monitor className="w-4 h-4" />;
};

// ─── Detail Modal ──────────────────────────────────────────────────

interface DetailModalProps {
  log: AuditLogEntry | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  const deviceIcon = getDeviceIcon(log.userAgent);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-slate-100 flex justify-between items-start z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <ActionIcon action={log.action} />
            </div>
            <div>
              <h2
                className={cn(
                  "text-xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={log.status} />
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{log.resource}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* User Info */}
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
              {log.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{log.userName}</p>
              <p className="text-sm text-slate-500">{log.userRole}</p>
              <p className="text-xs text-slate-400">ID: {log.userId}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Resource
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <ResourceIcon resource={log.resource} />
                {log.resource.charAt(0).toUpperCase() + log.resource.slice(1)}
                {log.resourceId && (
                  <span className="text-xs text-slate-400 font-normal">
                    #{log.resourceId}
                  </span>
                )}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Timestamp
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {formatTimestamp(log.timestamp)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Details
            </p>
            <p className="text-sm text-slate-700 mt-0.5 break-words">
              {log.details}
            </p>
          </div>

          {/* Device Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                IP Address
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                {log.ipAddress || "Unknown"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Device
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                {deviceIcon}
                {log.userAgent
                  ? log.userAgent.split(" ").slice(0, 3).join(" ")
                  : "Unknown"}
              </p>
            </div>
          </div>

          {/* Full User Agent */}
          {log.userAgent && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                User Agent
              </p>
              <p className="text-xs text-slate-500 mt-0.5 break-all font-mono">
                {log.userAgent}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <StatusBadge status={log.status} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────

export default function AuditLogsPanel() {
  const { user } = useDashboard();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const limit = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(filterAction !== "all" && { action: filterAction }),
        ...(filterResource !== "all" && { resource: filterResource }),
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const result = await apiFetch(`/api/audit-logs?${params}`);
      setLogs(result.logs || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    filterAction,
    filterResource,
    filterStatus,
    dateFrom,
    dateTo,
  ]);

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/audit-logs/export`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      alert("Failed to export logs");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterAction("all");
    setFilterResource("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const openDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
  };

  const closeDetail = () => {
    setSelectedLog(null);
  };

  // ─── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-5 w-64 bg-slate-100 rounded animate-pulse mt-1" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse">
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-48 bg-slate-200 rounded-xl" />
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3
          className={cn(
            "text-xl font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          Failed to load audit logs
        </h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Track all system activities and user actions across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="User, action, resource..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="export">Export</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Resource
            </label>
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            >
              <option value="all">All Resources</option>
              <option value="patient">Patient</option>
              <option value="user">User</option>
              <option value="appointment">Appointment</option>
              <option value="inventory">Inventory</option>
              <option value="prescription">Prescription</option>
              <option value="billing">Billing</option>
              <option value="settings">Settings</option>
              <option value="center">Center</option>
              <option value="medic">Medic</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div
          ref={tableRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        >
          {isMobile ? (
            // ─── Mobile Card View ──────────────────────────────
            <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No audit logs found
                </div>
              ) : (
                logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => openDetail(log)}
                    className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">
                          {log.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {log.userName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {log.userRole}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <ActionIcon action={log.action} />
                        {log.action}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <ResourceIcon resource={log.resource} />
                        {log.resource}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                      {log.details}
                    </p>

                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(log);
                        }}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                      >
                        View Details <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            // ─── Desktop Table View ─────────────────────────────
            <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/80">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => openDetail(log)}
                        className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-[10px] font-bold">
                              {log.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {log.userName}
                              </div>
                              <div className="text-xs text-slate-400">
                                {log.userRole}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                            <ActionIcon action={log.action} />
                            {log.action.charAt(0).toUpperCase() +
                              log.action.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <ResourceIcon resource={log.resource} />
                            {log.resource.charAt(0).toUpperCase() +
                              log.resource.slice(1)}
                            {log.resourceId && (
                              <span className="text-xs text-slate-400">
                                #{log.resourceId.slice(-6)}
                              </span>
                            )}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-slate-600 max-w-xs truncate"
                          title={log.details}
                        >
                          {log.details}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={log.status} />
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-slate-500">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)}{" "}
              of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && <DetailModal log={selectedLog} onClose={closeDetail} />}
      </AnimatePresence>
    </div>
  );
}
