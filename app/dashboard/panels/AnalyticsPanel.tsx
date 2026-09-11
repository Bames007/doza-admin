"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useAnalytics } from "../hooks/useAnalytics";
import {
  Users,
  Building2,
  Stethoscope,
  Gift,
  TrendingUp,
  RefreshCw,
  Activity,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

// ─── Colors ─────────────────────────────────────────────────────

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

// ─── Stat Card ──────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, subtitle }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-3">
      <div className={cn("p-2.5 rounded-xl", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
        <p
          className={cn(
            "text-2xl font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

// ─── Main Panel ──────────────────────────────────────────────────

export default function AnalyticsPanel() {
  const { data, loading, error, refetch } = useAnalytics();
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90" | "365" | "730">(
    "30",
  );

  // ─── Filter trends by days ──────────────────────────────────

  const filteredTrends = useMemo(() => {
    if (!data) return null;
    const days = parseInt(timeRange);
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    const filter = (trend: { date: string; count: number }[]) =>
      trend.filter((d) => new Date(d.date) >= start);
    return {
      centers: filter(data.trends.centers),
      medics: filter(data.trends.medics),
      users: filter(data.trends.users),
    };
  }, [data, timeRange]);

  // ─── Status breakdown for chart ─────────────────────────────

  const statusChartData = useMemo(() => {
    if (!data) return [];
    const { centers, medics } = data.status;
    return [
      { name: "Centers Pending", value: centers.pending },
      { name: "Centers Verified", value: centers.verified },
      { name: "Centers Rejected", value: centers.rejected },
      { name: "Medics Pending", value: medics.pending },
      { name: "Medics Verified", value: medics.verified },
      { name: "Medics Rejected", value: medics.rejected },
    ];
  }, [data]);

  // ─── Distribution pie data ──────────────────────────────────

  const distributionData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Centers", value: data.distribution.centers },
      { name: "Medics", value: data.distribution.medics },
      { name: "Users", value: data.distribution.users },
    ];
  }, [data]);

  // ─── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-slate-200 rounded-2xl" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Activity className="w-12 h-12 text-rose-500 mb-4" />
        <h3
          className={cn(
            "text-xl font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          Failed to load analytics
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {error || "No data available"}
        </p>
        <button
          onClick={refetch}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, recentActivity } = data;
  const trendData = filteredTrends!;

  // ─── Render ──────────────────────────────────────────────────

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
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Platform performance, growth trends, and key metrics
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Centers"
          value={metrics.totalCenters}
          icon={Building2}
          color="bg-emerald-500"
          subtitle={`${metrics.verifiedCenters} verified`}
        />
        <StatCard
          label="Total Medics"
          value={metrics.totalMedics}
          icon={Stethoscope}
          color="bg-purple-500"
          subtitle={`${metrics.verifiedMedics} verified`}
        />
        <StatCard
          label="Referral Codes"
          value={metrics.totalReferrals}
          icon={Gift}
          color="bg-amber-500"
          subtitle={`${metrics.activeReferralCodes} active`}
        />
      </div>

      {/* Time range selector */}
      <div className="flex justify-end">
        <div className="flex bg-slate-100 rounded-xl p-1 flex-wrap gap-1">
          {(["7", "30", "90", "365", "730"] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={cn(
                "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                timeRange === days
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {days === "7"
                ? "7d"
                : days === "30"
                  ? "30d"
                  : days === "90"
                    ? "90d"
                    : days === "365"
                      ? "1 Year"
                      : "2 Years"}
            </button>
          ))}
        </div>
      </div>

      {/* Registration Trends */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3
            className={cn(
              "text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Registration Trends
          </h3>
        </div>
        {trendData.centers.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-slate-400">
            No registration data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData.centers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d) => d.slice(5)}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                name="Centers"
                strokeWidth={2}
                dot={{ r: 1 }}
              />
              <Line
                type="monotone"
                data={trendData.medics}
                dataKey="count"
                stroke="#8b5cf6"
                name="Medics"
                strokeWidth={2}
                dot={{ r: 1 }}
              />
              <Line
                type="monotone"
                data={trendData.users}
                dataKey="count"
                stroke="#3b82f6"
                name="Users"
                strokeWidth={2}
                dot={{ r: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status and Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Status */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-slate-500" />
            <h3
              className={cn(
                "text-lg font-bold text-slate-800",
                bebasNeue.className,
              )}
            >
              Verification Status
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                {statusChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Entity Distribution */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-slate-500" />
            <h3
              className={cn(
                "text-lg font-bold text-slate-800",
                bebasNeue.className,
              )}
            >
              Entity Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-slate-500" />
          <h3
            className={cn(
              "text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Recent Registrations
          </h3>
        </div>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No recent activity
            </p>
          ) : (
            recentActivity.slice(0, 10).map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    {item.type === "center" ? (
                      <Building2 className="w-4 h-4 text-slate-600" />
                    ) : item.type === "medic" ? (
                      <Stethoscope className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Users className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">
                      {item.type}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
