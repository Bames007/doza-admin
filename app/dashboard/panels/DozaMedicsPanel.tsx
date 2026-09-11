// app/dashboard/components/panels/DozaMedicsPanel.tsx

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  Stethoscope,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Download,
  X,
  Users,
  AlertCircle,
  ChevronDown,
  Building,
  Briefcase,
  Award,
  BadgeCheck,
  List,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useMedics } from "../hooks/useMedics";
import { format } from "date-fns";
import {
  medicRoles,
  getRoleFromSpecialty as originalGetRole,
} from "../constants/medicRoles";

// ─── Improved role mapping (case‑insensitive, partial match) ──

export const getRoleFromSpecialty = (specialty?: string) => {
  if (!specialty) return medicRoles.find((r) => r.id === "other")!;
  const lower = specialty.toLowerCase().trim();

  // Try exact match first
  for (const role of medicRoles) {
    if (role.specialties.some((s) => s.toLowerCase() === lower)) {
      return role;
    }
  }

  // Try partial match (e.g., "nurse - Registered Nurse" → "nurse")
  for (const role of medicRoles) {
    if (
      role.specialties.some(
        (s) =>
          lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower),
      )
    ) {
      return role;
    }
  }

  // Keyword fallback
  const keywords: Record<string, string> = {
    doctor: "doctor",
    nurse: "nurse",
    pharmacist: "pharmacist",
    dentist: "dentist",
    dietician: "dietician",
    physiotherapist: "physiotherapist",
    psychologist: "psychologist",
    paramedic: "paramedic",
    chiropractor: "chiropractor",
    optometrist: "optometrist",
    cardiologist: "cardiologist",
  };
  for (const [keyword, id] of Object.entries(keywords)) {
    if (lower.includes(keyword)) {
      return (
        medicRoles.find((r) => r.id === id) ||
        medicRoles.find((r) => r.id === "other")!
      );
    }
  }

  return medicRoles.find((r) => r.id === "other")!;
};

// ─── Types ──────────────────────────────────────────────────────────

interface Medic {
  id: string;
  personalInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    profilePhoto?: string;
    specialty?: string;
  };
  practiceInfo?: {
    availability?: {
      days?: string[];
      hours?: { start?: string; end?: string };
      emergencyAvailable?: boolean;
    };
    consultationTypes?: {
      homeVisit?: boolean;
      inPerson?: boolean;
      online?: boolean;
    };
    hourlyRate?: number;
    languages?: string[];
  };
  professionalInfo?: {
    bio?: string;
    customRole?: string;
    customSpecialty?: string;
    licenseNumber?: string;
    qualifications?: string[];
    role?: string;
    specialties?: string[];
    yearsOfExperience?: number;
  };
  location?: {
    address: string;
    city: string;
    state: string;
    country: string;
    serviceRadius?: number;
  };
  legal?: {
    agreedToTerms: boolean;
    agreedToPrivacy: boolean;
    agreedToCommitment: boolean;
    signature: string;
    date: string;
  };
  credentials?: {
    verified: boolean;
    status?: "pending" | "verified" | "rejected";
    rejectionReason?: string;
    documents?: Array<{
      type: string;
      fileUrl: string;
      fileName: string;
      uploadDate: string;
    }>;
  };
  verified: boolean;
  createdAt: string;
  lastUpdated: string;
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

const formatDate = (iso?: string) => {
  if (!iso) return "N/A";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "Invalid date";
  }
};

// ─── Role Dropdown ──────────────────────────────────────────────

interface RoleDropdownProps {
  selected: string;
  onChange: (roleId: string) => void;
}

const RoleDropdown: React.FC<RoleDropdownProps> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredRoles = useMemo(() => {
    if (!search) return medicRoles;
    const lower = search.toLowerCase();
    return medicRoles.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.id.toLowerCase().includes(lower),
    );
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRole = medicRoles.find((r) => r.id === selected);
  const selectedLabel = selectedRole ? selectedRole.title : "All Roles";

  return (
    <div ref={containerRef} className="relative w-full sm:w-64">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-2xl max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            <button
              onClick={() => {
                onChange("all");
                setIsOpen(false);
                setSearch("");
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                selected === "all"
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <Users className="w-4 h-4" />
              All Roles
            </button>
            {filteredRoles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    onChange(role.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                    selected === role.id
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{role.title}</span>
                </button>
              );
            })}
            {filteredRoles.length === 0 && (
              <div className="px-3 py-4 text-sm text-slate-500 text-center">
                No matching roles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Detail Modal (shows everything from the DB + role specialties) ──

interface DetailModalProps {
  medic: Medic;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ medic, onClose }) => {
  const {
    personalInfo,
    practiceInfo,
    professionalInfo,
    location,
    legal,
    credentials,
    verified,
    createdAt,
    lastUpdated,
  } = medic;

  const fullName =
    `${personalInfo?.firstName || ""} ${personalInfo?.lastName || ""}`.trim() ||
    "Unknown";

  const status = credentials?.status || (verified ? "verified" : "pending");
  const roleKey = professionalInfo?.role || personalInfo?.specialty;
  const role = getRoleFromSpecialty(roleKey);
  const RoleIcon = role?.icon || User;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-start z-20 gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {personalInfo?.profilePhoto ? (
              <img
                src={personalInfo.profilePhoto}
                alt={fullName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <RoleIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            )}
            <div className="min-w-0">
              <h2
                className={cn(
                  "text-xl sm:text-2xl font-bold text-slate-900 truncate",
                  bebasNeue.className,
                )}
              >
                {fullName}
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {role?.title || "Other"}
                </span>
                <StatusBadge status={status as any} />
                {professionalInfo?.specialties?.length ? (
                  <span className="text-[11px] sm:text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                    {professionalInfo.specialties[0]}
                  </span>
                ) : (
                  personalInfo?.specialty && (
                    <span className="text-[11px] sm:text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                      {personalInfo.specialty}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* ─── Contact & Personal ─── */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contact & Personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 bg-slate-50 rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{personalInfo?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{personalInfo?.phone || "N/A"}</span>
              </div>
              {personalInfo?.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>DOB: {formatDate(personalInfo.dateOfBirth)}</span>
                </div>
              )}
              {personalInfo?.gender && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="capitalize">{personalInfo.gender}</span>
                </div>
              )}
              {professionalInfo?.role && (
                <div className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    Role: {professionalInfo.role}
                  </span>
                </div>
              )}
              {professionalInfo?.specialties &&
                professionalInfo.specialties.length > 0 && (
                  <div className="flex items-start sm:items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                    <Stethoscope className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                    <span>
                      Specialties: {professionalInfo.specialties.join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* ─── Role Specialties ─── */}
          {role && role.specialties.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <List className="w-3.5 h-3.5" /> Role Specialties
              </h3>
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4">
                <div className="flex flex-wrap gap-1.5">
                  {role.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="text-xs bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-700"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Practice Info ─── */}
          {practiceInfo && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-3.5 h-3.5" /> Practice Details
              </h3>
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 space-y-3">
                {practiceInfo.availability && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      Availability
                    </p>
                    {practiceInfo.availability.days && (
                      <p className="text-sm text-slate-600">
                        Days: {practiceInfo.availability.days.join(", ")}
                      </p>
                    )}
                    {practiceInfo.availability.hours && (
                      <p className="text-sm text-slate-600">
                        Hours: {practiceInfo.availability.hours.start} –{" "}
                        {practiceInfo.availability.hours.end}
                      </p>
                    )}
                    <p className="text-sm text-slate-600">
                      Emergency:{" "}
                      <span
                        className={
                          practiceInfo.availability.emergencyAvailable
                            ? "text-emerald-600 font-medium"
                            : "text-slate-600"
                        }
                      >
                        {practiceInfo.availability.emergencyAvailable
                          ? "Available"
                          : "Not available"}
                      </span>
                    </p>
                  </div>
                )}
                {practiceInfo.consultationTypes && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      Consultation Types
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(practiceInfo.consultationTypes).map(
                        ([key, val]) =>
                          val ? (
                            <span
                              key={key}
                              className="text-xs bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-700 capitalize"
                            >
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          ) : null,
                      )}
                    </div>
                  </div>
                )}
                {practiceInfo.hourlyRate !== undefined && (
                  <p className="text-sm text-slate-600 font-medium">
                    Hourly Rate:{" "}
                    <span className="text-emerald-700">
                      ₦{practiceInfo.hourlyRate.toLocaleString()}
                    </span>
                  </p>
                )}
                {practiceInfo.languages &&
                  practiceInfo.languages.length > 0 && (
                    <p className="text-sm text-slate-600">
                      Languages: {practiceInfo.languages.join(", ")}
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* ─── Professional Info ─── */}
          {professionalInfo && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5" /> Professional Details
              </h3>
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 space-y-2">
                {professionalInfo.bio && (
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Bio:</strong>{" "}
                    {professionalInfo.bio}
                  </p>
                )}
                {professionalInfo.licenseNumber && (
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-900">License:</strong>{" "}
                    {professionalInfo.licenseNumber}
                  </p>
                )}
                {professionalInfo.yearsOfExperience !== undefined && (
                  <p className="text-sm text-slate-600">
                    {professionalInfo.yearsOfExperience} years of experience
                  </p>
                )}
                {professionalInfo.qualifications &&
                  professionalInfo.qualifications.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Qualifications:
                      </p>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-0.5">
                        {professionalInfo.qualifications.map((cert, idx) => (
                          <li key={idx}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* ─── Location ─── */}
          {location && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Location
              </h3>
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 space-y-1">
                <p className="text-sm text-slate-700 font-medium">
                  {location.address}
                </p>
                <p className="text-sm text-slate-500">
                  {location.city}, {location.state}, {location.country}
                </p>
                {location.serviceRadius && (
                  <p className="text-xs text-slate-400 pt-1">
                    Service Radius: {location.serviceRadius} km
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ─── Legal Agreement ─── */}
          {legal && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Legal Agreement
              </h3>
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                <p className="text-sm text-slate-700">
                  Signed by{" "}
                  <span className="font-medium">
                    {legal.signature || "Unknown"}
                  </span>{" "}
                  on {formatDate(legal.date)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {legal.agreedToTerms && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                      ✓ Terms
                    </span>
                  )}
                  {legal.agreedToPrivacy && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                      ✓ Privacy
                    </span>
                  )}
                  {legal.agreedToCommitment && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                      ✓ Commitment
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Documents ─── */}
          {credentials?.documents && credentials.documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Documents ({credentials.documents.length})
              </h3>
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                {credentials.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm border-b border-slate-200/60 pb-2.5 last:border-0 last:pb-0 gap-3"
                  >
                    <span className="text-slate-700 truncate font-medium">
                      {doc.fileName || doc.type || "Document"}
                    </span>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Rejection Reason ─── */}
          {status === "rejected" && credentials?.rejectionReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 sm:p-4">
              <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                Rejection Reason
              </h4>
              <p className="text-sm text-rose-700 leading-relaxed">
                {credentials.rejectionReason}
              </p>
            </div>
          )}

          {/* ─── Timestamps ─── */}
          <div className="text-[11px] sm:text-xs text-slate-400 border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
            <span>Created: {formatDate(createdAt)}</span>
            <span>Updated: {formatDate(lastUpdated)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Panel ──────────────────────────────────────────────────

export default function DozaMedicsPanel() {
  const { medics, loading, error, refetch } = useMedics();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("all");
  const [selectedMedic, setSelectedMedic] = useState<Medic | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = medics.length;
    const verified = medics.filter((m: Medic) => m.verified).length;
    const pending = medics.filter(
      (m: Medic) => !m.verified && m.credentials?.status !== "rejected",
    ).length;
    const rejected = medics.filter(
      (m: Medic) => m.credentials?.status === "rejected",
    ).length;
    return { total, verified, pending, rejected };
  }, [medics]);

  // Filtered medics
  const filteredMedics = useMemo(() => {
    let result = medics;
    if (filterStatus !== "all") {
      result = result.filter((m: Medic) => {
        if (filterStatus === "verified") return m.verified;
        if (filterStatus === "pending")
          return !m.verified && m.credentials?.status !== "rejected";
        if (filterStatus === "rejected")
          return m.credentials?.status === "rejected";
        return true;
      });
    }

    if (selectedRoleId !== "all") {
      result = result.filter((m: Medic) => {
        // Use professionalInfo.role or fallback to personalInfo.specialty
        const roleKey = m.professionalInfo?.role || m.personalInfo?.specialty;
        const role = getRoleFromSpecialty(roleKey);
        return role?.id === selectedRoleId;
      });
    }

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter((m: Medic) => {
        const fullName =
          `${m.personalInfo?.firstName || ""} ${m.personalInfo?.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(term) ||
          m.personalInfo?.email?.toLowerCase().includes(term) ||
          m.personalInfo?.phone?.includes(term) ||
          m.personalInfo?.specialty?.toLowerCase().includes(term) ||
          m.professionalInfo?.role?.toLowerCase().includes(term) ||
          m.professionalInfo?.specialties?.some((s) =>
            s.toLowerCase().includes(term),
          )
        );
      });
    }
    return result;
  }, [medics, filterStatus, selectedRoleId, search]);

  const openDetail = (medic: Medic) => {
    setSelectedMedic(medic);
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
      <div
        className={cn(
          "flex flex-col items-center justify-center h-64 text-center",
          poppins.className,
        )}
      >
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3
          className={cn(
            "text-xl font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          Failed to load medics
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
            Doza Medics
          </h1>
          <p className="text-sm text-slate-500">
            Manage all registered medics on the platform
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
          label="Total Medics"
          value={stats.total}
          icon={Users}
          color="bg-slate-600"
          active={filterStatus === "all" && selectedRoleId === "all"}
          onClick={() => {
            setFilterStatus("all");
            setSelectedRoleId("all");
          }}
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
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, specialty, role, or practice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <RoleDropdown
            selected={selectedRoleId}
            onChange={setSelectedRoleId}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {(["all", "verified", "pending", "rejected"] as const).map(
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

      {/* Medics Grid */}
      {filteredMedics.length === 0 ? (
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
            No medics found
          </h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {search || selectedRoleId !== "all"
              ? "Try adjusting your search criteria or filters."
              : "No medics match the current filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedics.map((medic: Medic) => {
            const firstName = medic.personalInfo?.firstName || "";
            const lastName = medic.personalInfo?.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
            const initials =
              `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
              medic.id.slice(0, 2).toUpperCase();
            const status =
              medic.credentials?.status ||
              (medic.verified ? "verified" : "pending");
            const isVerified = status === "verified" || medic.verified;
            // Use professionalInfo.role if available
            const roleKey =
              medic.professionalInfo?.role || medic.personalInfo?.specialty;
            const role = getRoleFromSpecialty(roleKey);
            const RoleIcon = role?.icon || User;
            const professionalInfo = medic.professionalInfo || {};

            return (
              <motion.div
                key={medic.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => openDetail(medic)}
                className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/30 overflow-hidden cursor-pointer flex flex-col justify-between transition-all"
              >
                <div className="relative h-28 w-full bg-emerald-600 p-4 flex items-start justify-between">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20 pointer-events-none" />

                  <div className="z-10 flex flex-col items-start gap-1.5">
                    <StatusBadge status={status as any} />
                    {role && (
                      <div className="flex items-center gap-1 text-white/80 text-[11px] font-medium">
                        <RoleIcon className="w-3.5 h-3.5" />
                        <span>{role.title}</span>
                      </div>
                    )}
                  </div>

                  {professionalInfo.specialties?.[0] && (
                    <span className="z-10 text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 shadow-sm">
                      {professionalInfo.specialties[0]}
                    </span>
                  )}
                </div>

                <div className="px-6 pb-6 pt-0 relative flex flex-col flex-1">
                  <div className="relative -mt-10 mb-3 flex items-end justify-between">
                    <div className="relative">
                      {medic.personalInfo?.profilePhoto ? (
                        <img
                          src={medic.personalInfo.profilePhoto}
                          alt={fullName}
                          className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold tracking-wider">
                          {initials}
                        </div>
                      )}
                      {isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-100">
                          <svg
                            className="w-4 h-4 text-emerald-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

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
                      {medic.personalInfo?.email || "No email provided"}
                    </p>
                    {professionalInfo.role && (
                      <p className="text-xs text-slate-400 truncate">
                        <Briefcase className="w-3 h-3 inline mr-1" />
                        {professionalInfo.role}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mb-4">
                    {medic.personalInfo?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium">
                          {medic.personalInfo.phone}
                        </span>
                      </div>
                    )}
                    {medic.location?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 text-slate-500">
                          {medic.location.address}, {medic.location.city || ""}
                        </span>
                      </div>
                    )}
                    {professionalInfo.qualifications?.[0] && (
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-500">
                          {professionalInfo.qualifications[0]}
                          {professionalInfo.qualifications.length > 1 && (
                            <span>
                              {" "}
                              +{professionalInfo.qualifications.length - 1}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      Joined {formatDate(medic.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(medic);
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
        {showDetailModal && selectedMedic && (
          <DetailModal
            medic={selectedMedic}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
