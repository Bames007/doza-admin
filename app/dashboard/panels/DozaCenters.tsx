// app/dashboard/components/panels/admin/DozaCentersPanel.tsx

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Package,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Shield,
  FileText,
  X,
  Filter,
  Settings,
  Store,
  Hospital,
  Pill,
  Microscope,
  Heart,
  Smile,
  EyeIcon,
  Ambulance,
  Briefcase,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useCenters } from "../hooks/useCenters";
import { useAuth } from "@/app/utils/AuthContext";
import { apiPut } from "@/app/lib/api";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────

interface Center {
  centerId: string;
  centerName: string;
  centerType: string;
  status: string;
  verified: boolean;
  staffCount: number;
  productCount: number;
  totalInventoryValue: number;
  email?: string;
  phone?: string;
  logo?: string;
  location?: {
    address: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  };
  ownerInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
  registrationNumbers?: {
    cac: string;
    state: string;
    federal: string;
  };
  operatingHours?: {
    opening: string;
    closing: string;
    days: string[];
    timezone: string;
  };
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

type FilterStatus = "all" | "verified" | "pending" | "rejected";

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
  status: "pending" | "verified" | "rejected";
}) => {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
    verified: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle,
    },
    rejected: { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
  };
  const { bg, text, icon: Icon } = config[status] || config.pending;
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

const CenterTypeIcon = ({ type }: { type: string }) => {
  const iconMap: Record<string, any> = {
    hospital: Hospital,
    clinic: Briefcase,
    pharmacy: Pill,
    diagnostic_lab: Microscope,
    medical_center: Heart,
    dental_clinic: Smile,
    optical_center: EyeIcon,
    emergency: Ambulance,
  };
  const Icon = iconMap[type?.toLowerCase()] || Building2;
  return <Icon className="w-4 h-4" />;
};

const formatDate = (iso?: string) => {
  if (!iso) return "N/A";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "Invalid date";
  }
};

const formatCurrency = (amount: number) => {
  if (!amount) return "₦0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ─── Detail Modal ─────────────────────────────────────────────

interface DetailModalProps {
  center: Center;
  onClose: () => void;
  onVerify: (centerId: string, verified: boolean, reason?: string) => void;
  isSubmitting: boolean;
}

const DetailModal: React.FC<DetailModalProps> = ({
  center,
  onClose,
  onVerify,
  isSubmitting,
}) => {
  const {
    centerId,
    centerName,
    centerType,
    status,
    verified,
    staffCount,
    productCount,
    totalInventoryValue,
    email,
    phone,
    logo,
    location,
    ownerInfo,
    registrationNumbers,
    operatingHours,
    rejectionReason,
    createdAt,
    updatedAt,
  } = center;

  const displayStatus = status || (verified ? "verified" : "pending");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    onVerify(centerId, false, rejectReason);
    onClose();
  };

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
            {logo && !logoError ? (
              <img
                src={logo}
                alt={centerName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2
                className={cn(
                  "text-2xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                {centerName || "Unnamed Center"}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Center
                </span>
                <StatusBadge status={displayStatus as any} />
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CenterTypeIcon type={centerType} /> {centerType || "Unknown"}
                </span>
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
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium">Staff</p>
              <p className="text-xl font-bold text-slate-800">
                {staffCount || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium">Products</p>
              <p className="text-xl font-bold text-slate-800">
                {productCount || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium">
                Inventory Value
              </p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(totalInventoryValue || 0)}
              </p>
            </div>
          </div>

          {/* Contact & Meta - with clickable links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{email}</span>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
              >
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{phone}</span>
              </a>
            )}
            {createdAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Created: {formatDate(createdAt)}</span>
              </div>
            )}
            {updatedAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Updated: {formatDate(updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Location
              </h4>
              <p className="text-sm text-slate-700">{location.address}</p>
              <p className="text-sm text-slate-500">
                {location.city}, {location.state}, {location.country}
              </p>
            </div>
          )}

          {/* Owner Info */}
          {ownerInfo && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Owner
              </h4>
              <p className="text-sm text-slate-700">{ownerInfo.fullName}</p>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm text-slate-500">
                {ownerInfo.email && (
                  <a
                    href={`mailto:${ownerInfo.email}`}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {ownerInfo.email}
                  </a>
                )}
                {ownerInfo.phone && (
                  <a
                    href={`tel:${ownerInfo.phone}`}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {ownerInfo.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Registration Numbers */}
          {registrationNumbers && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Registration Numbers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-700">
                <div>
                  <span className="font-medium">CAC:</span>{" "}
                  {registrationNumbers.cac || "N/A"}
                </div>
                <div>
                  <span className="font-medium">State:</span>{" "}
                  {registrationNumbers.state || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Federal:</span>{" "}
                  {registrationNumbers.federal || "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Operating Hours */}
          {operatingHours && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Operating Hours
              </h4>
              <p className="text-sm text-slate-600">
                {operatingHours.opening} – {operatingHours.closing} (
                {operatingHours.timezone})
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {operatingHours.days.join(", ")}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {displayStatus === "rejected" && rejectionReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                Rejection Reason
              </h4>
              <p className="text-sm text-rose-700">{rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          {displayStatus === "pending" && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  onVerify(centerId, true);
                  onClose();
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Verify
              </button>
              <button
                onClick={() => setShowRejectInput(!showRejectInput)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
          {showRejectInput && displayStatus === "pending" && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Rejection reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this center is being rejected..."
                className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all resize-none h-20"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {displayStatus !== "pending" && (
            <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
              This center has been {displayStatus}.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Center Card Component ─────────────────────────────────────

interface CenterCardProps {
  center: Center;
  onOpenDetail: (center: Center) => void;
}

const CenterCard: React.FC<CenterCardProps> = ({ center, onOpenDetail }) => {
  const [logoError, setLogoError] = useState(false);

  const status = center.status || (center.verified ? "verified" : "pending");
  const isVerified = status === "verified" || center.verified;
  const centerName = center.centerName || "Unnamed Center";
  const initials =
    centerName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpenDetail(center)}
      className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/30 overflow-hidden cursor-pointer flex flex-col justify-between transition-all"
    >
      {/* Header with gradient background */}
      <div className="relative h-28 w-full bg-emerald-600 p-4 flex items-start justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20 pointer-events-none" />

        <div className="z-10 flex flex-col items-start gap-1.5">
          <StatusBadge status={status as any} />
          <div className="flex items-center gap-1 text-white/80 text-[11px] font-medium">
            <CenterTypeIcon type={center.centerType} />
            <span>{center.centerType || "Unknown"}</span>
          </div>
        </div>

        {center.totalInventoryValue > 0 && (
          <span className="z-10 text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 shadow-sm">
            {formatCurrency(center.totalInventoryValue)}
          </span>
        )}
      </div>

      <div className="px-6 pb-6 pt-0 relative flex flex-col flex-1">
        {/* Logo / Avatar with verified badge */}
        <div className="relative -mt-10 mb-3 flex items-end justify-between">
          <div className="relative">
            {center.logo && !logoError ? (
              <img
                src={center.logo}
                alt={centerName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold tracking-wider">
                {initials}
              </div>
            )}
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
            )}
          </div>
        </div>

        {/* Name & details */}
        <div className="space-y-0.5 mb-4">
          <h3
            className={cn(
              "text-xl font-bold text-slate-800 tracking-tight",
              bebasNeue.className,
            )}
          >
            {centerName}
          </h3>
          {center.email ? (
            <a
              href={`mailto:${center.email}`}
              className="text-xs text-slate-500 font-medium truncate hover:text-emerald-600 transition-colors block"
              onClick={(e) => e.stopPropagation()}
            >
              {center.email}
            </a>
          ) : (
            <p className="text-xs text-slate-500 font-medium truncate">
              No email provided
            </p>
          )}
          {center.ownerInfo?.fullName && (
            <p className="text-xs text-slate-400 truncate">
              <Users className="w-3 h-3 inline mr-1" />
              {center.ownerInfo.fullName}
            </p>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mb-4">
          {center.phone && (
            <a
              href={`tel:${center.phone}`}
              className="flex items-center gap-2 hover:text-emerald-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium">{center.phone}</span>
            </a>
          )}
          {center.location?.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="line-clamp-1 text-slate-500">
                {center.location.address}, {center.location.city || ""}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{center.staffCount || 0} staff</span>
            <span className="mx-1 text-slate-300">•</span>
            <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{center.productCount || 0} products</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Joined {formatDate(center.createdAt)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(center);
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
};

// ─── Main Panel ──────────────────────────────────────────────────

export default function DozaCentersPanel() {
  const { centers, loading, error, refetch } = useCenters();
  const { user } = useAuth();
  const isCEO = user?.role === "ceo" || user?.role === "admin";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = centers.length;
    const verified = centers.filter((c: Center) => c.verified).length;
    const pending = centers.filter(
      (c: Center) => !c.verified && c.status !== "rejected",
    ).length;
    const rejected = centers.filter(
      (c: Center) => c.status === "rejected",
    ).length;
    return { total, verified, pending, rejected };
  }, [centers]);

  // Filtered centers
  const filteredCenters = useMemo(() => {
    let result = centers;
    if (filterStatus !== "all") {
      result = result.filter((c: Center) => {
        if (filterStatus === "verified") return c.verified;
        if (filterStatus === "pending")
          return !c.verified && c.status !== "rejected";
        if (filterStatus === "rejected") return c.status === "rejected";
        return true;
      });
    }
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(
        (c: Center) =>
          (c.centerName || "").toLowerCase().includes(term) ||
          (c.centerType || "").toLowerCase().includes(term) ||
          (c.email || "").toLowerCase().includes(term) ||
          (c.phone || "").includes(term) ||
          (c.ownerInfo?.fullName || "").toLowerCase().includes(term),
      );
    }
    return result;
  }, [centers, filterStatus, search]);

  const handleVerify = async (
    centerId: string,
    verified: boolean,
    reason?: string,
  ) => {
    setIsSubmitting(true);
    try {
      await apiPut(`/api/doza-centers?centerId=${centerId}`, {
        verified,
        status: verified ? "verified" : "rejected",
        rejectionReason: reason || "",
      });
      refetch();
    } catch (err) {
      alert("Failed to update center. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (center: Center) => {
    setSelectedCenter(center);
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
          Failed to load centers
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
            Doza Centers
          </h1>
          <p className="text-sm text-slate-500">
            Manage all registered healthcare centers on the platform
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
          icon={Building2}
          color="bg-slate-600"
          active={filterStatus === "all"}
          onClick={() => setFilterStatus("all")}
        />
        <StatCard
          label="Verified"
          value={stats.verified}
          icon={CheckCircle}
          color="bg-emerald-600"
          active={filterStatus === "verified"}
          onClick={() =>
            setFilterStatus(filterStatus === "verified" ? "all" : "verified")
          }
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500"
          active={filterStatus === "pending"}
          onClick={() =>
            setFilterStatus(filterStatus === "pending" ? "all" : "pending")
          }
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="bg-rose-500"
          active={filterStatus === "rejected"}
          onClick={() =>
            setFilterStatus(filterStatus === "rejected" ? "all" : "rejected")
          }
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, type, email, phone, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "verified", "pending", "rejected"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all",
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
      </div>

      {/* Centers Grid */}
      {filteredCenters.length === 0 ? (
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
            No centers found
          </h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {search
              ? "Try adjusting your search criteria."
              : "No centers match the current filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map((center) => (
            <CenterCard
              key={center.centerId}
              center={center}
              onOpenDetail={openDetail}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCenter && (
          <DetailModal
            center={selectedCenter}
            onClose={() => setShowDetailModal(false)}
            onVerify={handleVerify}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
