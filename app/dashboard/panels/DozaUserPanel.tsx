// app/dashboard/components/panels/DozaUsersPanel.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  X,
  Users,
  AlertCircle,
  Shield,
  CreditCard,
  Crown,
  Star,
  Briefcase,
  MapPin,
  Award,
  BadgeCheck,
  ChevronDown,
  Building2,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useUsers } from "../hooks/useUsers";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  personalProfile?: {
    fname: string;
    lname: string;
    phone: string;
    profileImage?: string;
    dob?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  subscription?: {
    plan: "free" | "premium" | "professional" | "enterprise";
    status: "active" | "inactive" | "trial" | "expired";
    startDate?: string;
    endDate?: string;
    features?: string[];
  };
  role: "user" | "admin" | "ceo";
  verified: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  [key: string]: any;
}

type FilterStatus = "all" | "active" | "inactive" | "trial" | "expired";
type FilterPlan = "all" | "free" | "premium" | "professional" | "enterprise";

// ─── Helpers ──────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  active,
  onClick,
}: any) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 cursor-pointer transition-all",
      active
        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30"
        : "border-slate-200/80 hover:border-slate-300",
    )}
  >
    <div className={cn("p-2.5 rounded-xl", color)}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p
        className={cn("text-2xl font-bold text-slate-800", bebasNeue.className)}
      >
        {value}
      </p>
    </div>
  </div>
);

const StatusBadge = ({
  status,
}: {
  status: "active" | "inactive" | "trial" | "expired";
}) => {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    active: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle,
    },
    inactive: { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
    trial: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
    expired: { bg: "bg-slate-100", text: "text-slate-700", icon: XCircle },
  };
  const { bg, text, icon: Icon } = config[status] || config.inactive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full",
        bg,
        text,
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PlanBadge = ({ plan }: { plan: string }) => {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    free: { bg: "bg-slate-100", text: "text-slate-600", icon: Star },
    premium: { bg: "bg-blue-100", text: "text-blue-700", icon: Crown },
    professional: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      icon: Briefcase,
    },
    enterprise: { bg: "bg-amber-100", text: "text-amber-700", icon: Building2 },
  };
  const { bg, text, icon: Icon } = config[plan] || config.free;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full",
        bg,
        text,
      )}
    >
      <Icon className="w-3 h-3" />
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
};

const formatDate = (iso?: string) => {
  if (!iso) return "N/A";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "Invalid date";
  }
};

// ─── Detail Modal ────────────────────────────────────────────────

interface DetailModalProps {
  user: User;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ user, onClose }) => {
  const {
    personalProfile,
    subscription,
    email,
    role,
    verified,
    emailVerified,
    createdAt,
    lastLogin,
  } = user;

  const fullName =
    `${personalProfile?.fname || ""} ${personalProfile?.lname || ""}`.trim() ||
    "Unknown User";

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
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-slate-100 flex justify-between items-start z-10">
          <div className="flex items-center gap-4">
            {personalProfile?.profileImage ? (
              <img
                src={personalProfile.profileImage}
                alt={fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2
                className={cn(
                  "text-2xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                {fullName}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  User
                </span>
                {subscription && <PlanBadge plan={subscription.plan} />}
                {subscription && (
                  <StatusBadge status={subscription.status as any} />
                )}
                {verified && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
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

        <div className="p-6 space-y-6">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
            {email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{email}</span>
              </div>
            )}
            {personalProfile?.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{personalProfile.phone}</span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined: {formatDate(createdAt)}</span>
              </div>
            )}
            {lastLogin && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Last login: {formatDate(lastLogin)}</span>
              </div>
            )}
          </div>

          {/* Subscription */}
          {subscription && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" /> Subscription
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium text-slate-500">Plan</span>
                  <p className="text-slate-800 font-semibold capitalize">
                    {subscription.plan}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Status</span>
                  <p className="text-slate-800 capitalize">
                    {subscription.status}
                  </p>
                </div>
                {subscription.startDate && (
                  <div>
                    <span className="font-medium text-slate-500">Start</span>
                    <p className="text-slate-800">
                      {formatDate(subscription.startDate)}
                    </p>
                  </div>
                )}
                {subscription.endDate && (
                  <div>
                    <span className="font-medium text-slate-500">End</span>
                    <p className="text-slate-800">
                      {formatDate(subscription.endDate)}
                    </p>
                  </div>
                )}
              </div>
              {subscription.features && subscription.features.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Features
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subscription.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-700"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Personal Details */}
          {personalProfile && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Personal Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {personalProfile.dob && (
                  <div>
                    <span className="font-medium text-slate-500">DOB</span>
                    <p className="text-slate-800">
                      {formatDate(personalProfile.dob)}
                    </p>
                  </div>
                )}
                {personalProfile.gender && (
                  <div>
                    <span className="font-medium text-slate-500">Gender</span>
                    <p className="text-slate-800 capitalize">
                      {personalProfile.gender}
                    </p>
                  </div>
                )}
                {personalProfile.address && (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-slate-500">Address</span>
                    <p className="text-slate-800">
                      {personalProfile.address}
                      {personalProfile.city && `, ${personalProfile.city}`}
                      {personalProfile.state && `, ${personalProfile.state}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Role & Verification */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Account Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-slate-500">Role</span>
                <p className="text-slate-800 capitalize">{role || "User"}</p>
              </div>
              <div>
                <span className="font-medium text-slate-500">
                  Email Verified
                </span>
                <p className="text-slate-800">{emailVerified ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Panel ──────────────────────────────────────────────────

export default function DozaUsersPanel() {
  const { users, loading, error, refetch } = useUsers();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPlan, setFilterPlan] = useState<FilterPlan>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(
      (u) => u.subscription?.status === "active",
    ).length;
    const inactive = users.filter(
      (u) => u.subscription?.status === "inactive" || !u.subscription,
    ).length;
    const trial = users.filter(
      (u) => u.subscription?.status === "trial",
    ).length;
    const expired = users.filter(
      (u) => u.subscription?.status === "expired",
    ).length;
    return { total, active, inactive, trial, expired };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = users;

    if (filterStatus !== "all") {
      result = result.filter((u) => u.subscription?.status === filterStatus);
    }

    if (filterPlan !== "all") {
      result = result.filter((u) => u.subscription?.plan === filterPlan);
    }

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter((u) => {
        const fullName =
          `${u.personalProfile?.fname || ""} ${u.personalProfile?.lname || ""}`.toLowerCase();
        return (
          fullName.includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.personalProfile?.phone?.includes(term)
        );
      });
    }
    return result;
  }, [users, filterStatus, filterPlan, search]);

  const openDetail = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse"
            >
              <div className="h-10 w-10 bg-slate-200 rounded-xl" />
              <div className="h-4 w-16 bg-slate-200 rounded mt-2" />
              <div className="h-6 w-12 bg-slate-200 rounded mt-1" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm animate-pulse p-4">
          <div className="h-10 w-full bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm animate-pulse space-y-4"
            >
              <div className="h-32 bg-slate-100 rounded-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          ))}
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
          Failed to load users
        </h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium"
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
            Platform Users
          </h1>
          <p className="text-sm text-slate-500">
            Manage all registered users and their subscriptions
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Users}
          color="bg-slate-600"
          active={filterStatus === "all" && filterPlan === "all"}
          onClick={() => {
            setFilterStatus("all");
            setFilterPlan("all");
          }}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle}
          color="bg-emerald-600"
          active={filterStatus === "active"}
          onClick={() =>
            setFilterStatus(filterStatus === "active" ? "all" : "active")
          }
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          icon={XCircle}
          color="bg-rose-500"
          active={filterStatus === "inactive"}
          onClick={() =>
            setFilterStatus(filterStatus === "inactive" ? "all" : "inactive")
          }
        />
        <StatCard
          label="Trial"
          value={stats.trial}
          icon={Clock}
          color="bg-amber-500"
          active={filterStatus === "trial"}
          onClick={() =>
            setFilterStatus(filterStatus === "trial" ? "all" : "trial")
          }
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          {/* Plan filter dropdown */}
          <div className="flex gap-2">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as FilterPlan)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {(["all", "active", "inactive", "trial", "expired"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all",
                  filterStatus === status
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {status === "all" ? "All Statuses" : status}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Search className="w-8 h-8" />
          </div>
          <h4
            className={cn(
              "text-xl font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No users found
          </h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {search || filterStatus !== "all" || filterPlan !== "all"
              ? "Try adjusting your search criteria or filters."
              : "No users match the current filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user: User) => {
            const fullName =
              `${user.personalProfile?.fname || ""} ${user.personalProfile?.lname || ""}`.trim() ||
              "Unknown";
            const initials =
              `${(user.personalProfile?.fname || "").charAt(0)}${(user.personalProfile?.lname || "").charAt(0)}`.toUpperCase() ||
              user.email?.charAt(0).toUpperCase() ||
              "U";
            const subscription = user.subscription;
            const status = subscription?.status || "inactive";
            const plan = subscription?.plan || "free";

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => openDetail(user)}
                className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/30 overflow-hidden cursor-pointer flex flex-col justify-between transition-all"
              >
                {/* Header with gradient background */}
                <div className="relative h-28 w-full bg-emerald-600 p-4 flex items-start justify-between">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20 pointer-events-none" />

                  <div className="z-10 flex flex-col items-start gap-1.5">
                    <StatusBadge status={status as any} />
                    <PlanBadge plan={plan} />
                  </div>

                  {subscription?.endDate && (
                    <span className="z-10 text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 shadow-sm">
                      {formatDate(subscription.endDate)}
                    </span>
                  )}
                </div>

                <div className="px-6 pb-6 pt-0 relative flex flex-col flex-1">
                  {/* Avatar with verified badge */}
                  <div className="relative -mt-10 mb-3 flex items-end justify-between">
                    <div className="relative">
                      {user.personalProfile?.profileImage ? (
                        <img
                          src={user.personalProfile.profileImage}
                          alt={fullName}
                          className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold tracking-wider">
                          {initials}
                        </div>
                      )}
                      {user.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-100">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name & email */}
                  <div className="space-y-0.5 mb-4">
                    <h3
                      className={cn(
                        "text-xl font-bold text-slate-800 tracking-tight",
                        bebasNeue.className,
                      )}
                    >
                      {fullName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {user.email || "No email"}
                    </p>
                    {user.personalProfile?.phone && (
                      <p className="text-xs text-slate-400 truncate">
                        <Phone className="w-3 h-3 inline mr-1" />
                        {user.personalProfile.phone}
                      </p>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium capitalize">
                        Role: {user.role || "User"}
                      </span>
                    </div>
                    {subscription?.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Since {formatDate(subscription.startDate)}</span>
                      </div>
                    )}
                    {user.lastLogin && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Last login: {formatDate(user.lastLogin)}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      Joined {formatDate(user.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(user);
                      }}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1.5 border border-emerald-100 group-hover:border-transparent"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <DetailModal
            user={selectedUser}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
