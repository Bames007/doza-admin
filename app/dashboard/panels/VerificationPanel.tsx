// app/dashboard/components/panels/admin/VerificationPanel.tsx
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Stethoscope,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  UsersIcon,
  Eye,
  FileText,
  MapPin,
  Award,
  Shield,
  Download,
  User,
  Hospital,
  Pill,
  Heart,
  Microscope,
  Ambulance,
  Smile,
  Eye as EyeIcon,
  Briefcase,
  ChevronDown,
  BadgeCheck,
  List,
  Send,
  MessageSquare,
  Globe,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useCenters } from "../hooks/useCenters";
import { useMedics } from "../hooks/useMedics";
import { useAuth } from "@/app/utils/AuthContext";
import { apiPut } from "@/app/lib/api";
import { format } from "date-fns";
import { medicRoles } from "../constants/medicRoles";

// ─── Improved role mapping ──────────────────────────────────────────

const getRoleFromSpecialtyImproved = (specialty?: string) => {
  if (!specialty) return medicRoles.find((r) => r.id === "other")!;
  const lower = specialty.toLowerCase().trim();
  for (const role of medicRoles) {
    if (role.specialties.some((s) => s.toLowerCase() === lower)) {
      return role;
    }
  }
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

const getRoleFromString = (roleString?: string, specialty?: string) => {
  if (roleString) {
    const lower = roleString.toLowerCase().trim();
    const directMatch = medicRoles.find((r) => r.id === lower);
    if (directMatch) return directMatch;
  }
  return getRoleFromSpecialtyImproved(specialty || roleString);
};

// ─── Types ──────────────────────────────────────────────────────────

type EntityType = "center" | "medic";
type VerificationStatus = "pending" | "verified" | "rejected";

interface NormalizedEntity {
  id: string;
  name: string;
  type: EntityType;
  status: VerificationStatus;
  email: string;
  phone: string;
  createdAt?: string;
  rejectionReason?: string;
  raw: any; // original data
}

// ─── Helpers ──────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
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

const StatusBadge = ({ status }: { status: VerificationStatus }) => {
  const config: Record<
    VerificationStatus,
    { bg: string; text: string; icon: any }
  > = {
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
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
        bg,
        text,
      )}
    >
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const EntityIcon = ({ type }: { type: EntityType }) =>
  type === "center" ? (
    <Building2 className="w-4 h-4" />
  ) : (
    <Stethoscope className="w-4 h-4" />
  );

const formatDate = (iso?: string) => {
  if (!iso) return "N/A";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "Invalid date";
  }
};

// ─── Contact Buttons ──────────────────────────────────────────────

const ContactButtons = ({ email, phone }: { email: string; phone: string }) => {
  const whatsappUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "#";
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Mail className="w-3 h-3" /> Email
        </a>
      )}
      {phone && (
        <>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Phone className="w-3 h-3" /> Call
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </a>
        </>
      )}
    </div>
  );
};

// ─── Rejection Modal ─────────────────────────────────────────────────

interface RejectionModalProps {
  entityName: string;
  entityType: EntityType;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const RejectionModal: React.FC<RejectionModalProps> = ({
  entityName,
  entityType,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
          <h3
            className={cn(
              "text-xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Reject {entityType}
          </h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Provide a reason for rejecting <strong>{entityName}</strong>.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Missing documents, incomplete profile, suspicious activity..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all resize-none h-24"
        />
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isLoading}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Processing..." : "Reject"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Entity Detail Modal ──────────────────────────────────────────

interface EntityDetailModalProps {
  entity: NormalizedEntity;
  onClose: () => void;
  onVerify: (id: string, type: EntityType) => void;
  onReject: (id: string, type: EntityType) => void;
  isSubmitting: boolean;
}

const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  entity,
  onClose,
  onVerify,
  onReject,
  isSubmitting,
}) => {
  const { type, raw, status } = entity;
  const isCenter = type === "center";

  const profileImage = isCenter ? raw.logo : raw.personalInfo?.profileImage;
  const documents = isCenter ? [] : raw.credentials?.documents || [];
  const centerType = isCenter ? raw.centerType : null;
  const address = isCenter ? raw.location?.address : null;
  const registrationNumbers = isCenter ? raw.registrationNumbers : null;
  const operatingHours = isCenter ? raw.operatingHours : null;
  const ownerInfo = isCenter ? raw.ownerInfo : null;

  // Medic data
  const professionalInfo = !isCenter ? raw.professionalInfo : null;
  const practiceInfo = !isCenter ? raw.practiceInfo : null;
  const specialty = !isCenter
    ? raw.specialty || raw.personalInfo?.specialty
    : null;
  const role = !isCenter
    ? getRoleFromString(professionalInfo?.role, specialty || undefined)
    : null;

  const verificationHistory = [
    { action: "Created", date: entity.createdAt, status: "pending" },
  ];

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
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-slate-100 flex justify-between items-start z-10">
          <div className="flex items-center gap-4">
            {profileImage ? (
              <img
                src={profileImage}
                alt={entity.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                {isCenter ? (
                  <Building2 className="w-8 h-8" />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
            )}
            <div>
              <h2
                className={cn(
                  "text-2xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                {entity.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {type}
                </span>
                {!isCenter && role && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {role.title}
                  </span>
                )}
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{entity.email || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{entity.phone || "N/A"}</span>
            </div>
            {entity.createdAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined {formatDate(entity.createdAt)}</span>
              </div>
            )}
            {isCenter && centerType && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Award className="w-4 h-4 text-slate-400" />
                <span>Type: {centerType}</span>
              </div>
            )}
          </div>

          {/* Contact Buttons */}
          <div className="flex flex-wrap gap-2">
            <ContactButtons email={entity.email} phone={entity.phone} />
          </div>

          {/* Center-specific */}
          {isCenter && (
            <div className="space-y-3">
              {address && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span>{address}</span>
                </div>
              )}
              {ownerInfo && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Owner
                  </h4>
                  <p className="text-sm text-slate-700">{ownerInfo.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {ownerInfo.email} | {ownerInfo.phone}
                  </p>
                </div>
              )}
              {registrationNumbers && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Registrations
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
              {operatingHours && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Hours
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
            </div>
          )}

          {/* Medic-specific */}
          {!isCenter && (
            <div className="space-y-4">
              {professionalInfo && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BadgeCheck className="w-3.5 h-3.5" /> Professional
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5">
                    {professionalInfo.bio && (
                      <p className="text-sm text-slate-700">
                        {professionalInfo.bio}
                      </p>
                    )}
                    {professionalInfo.role && (
                      <p className="text-sm text-slate-700">
                        Role: {professionalInfo.role}
                      </p>
                    )}
                    {professionalInfo.specialties?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Specialties:
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-600">
                          {professionalInfo.specialties.map(
                            (s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                    {professionalInfo.licenseNumber && (
                      <p className="text-sm text-slate-700">
                        License: {professionalInfo.licenseNumber}
                      </p>
                    )}
                    {professionalInfo.yearsOfExperience !== undefined && (
                      <p className="text-sm text-slate-600">
                        {professionalInfo.yearsOfExperience} years experience
                      </p>
                    )}
                    {professionalInfo.qualifications?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Qualifications:
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-600">
                          {professionalInfo.qualifications.map(
                            (q: string, i: number) => (
                              <li key={i}>{q}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {practiceInfo && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Practice
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                    {practiceInfo.availability && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">
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
                          {practiceInfo.availability.emergencyAvailable
                            ? "Available"
                            : "Not available"}
                        </p>
                      </div>
                    )}
                    {practiceInfo.consultationTypes && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Consultation Types
                        </p>
                        <div className="flex flex-wrap gap-2">
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
                      <p className="text-sm text-slate-600">
                        Hourly Rate: ₦{practiceInfo.hourlyRate.toLocaleString()}
                      </p>
                    )}
                    {practiceInfo.languages?.length > 0 && (
                      <p className="text-sm text-slate-600">
                        Languages: {practiceInfo.languages.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {documents.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Documents
                  </h4>
                  <ul className="space-y-2">
                    {documents.map((doc: any, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700">
                          {doc.name || doc.type || "Document"}
                        </span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          <Download className="w-3 h-3" /> View
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Rejection Reason */}
          {status === "rejected" && entity.rejectionReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                Rejection Reason
              </h4>
              <p className="text-sm text-rose-700">{entity.rejectionReason}</p>
            </div>
          )}

          {/* History */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3" /> History
            </h4>
            <ul className="space-y-2">
              {verificationHistory.map((event, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-slate-700">{event.action}</span>
                  <span className="text-slate-400 text-xs">
                    {formatDate(event.date)}
                  </span>
                  <StatusBadge status={event.status as VerificationStatus} />
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          {status === "pending" && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  onVerify(entity.id, entity.type);
                  onClose();
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Verify
              </button>
              <button
                onClick={() => {
                  onReject(entity.id, entity.type);
                  onClose();
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
          {status !== "pending" && (
            <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
              This entity has been {status}.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Role Dropdown ──────────────────────────────────────────────────

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
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRole = medicRoles.find((r) => r.id === selected);
  const selectedLabel = selectedRole ? selectedRole.title : "All Roles";

  return (
    <div ref={containerRef} className="relative w-full sm:w-48">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-emerald-500/40"
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
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500/40 outline-none"
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
              <UsersIcon className="w-4 h-4" /> All Roles
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
                  <Icon className="w-4 h-4" /> {role.title}
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

// ─── Main Panel ──────────────────────────────────────────────────

export default function VerificationPanel() {
  const { user } = useAuth();
  const isCEO = user?.role === "ceo" || user?.role === "admin";

  const {
    centers,
    loading: centersLoading,
    refetch: refetchCenters,
  } = useCenters();
  const {
    medics,
    loading: medicsLoading,
    refetch: refetchMedics,
  } = useMedics();

  const [activeTab, setActiveTab] = useState<VerificationStatus>("pending");
  const [filterType, setFilterType] = useState<"all" | "center" | "medic">(
    "all",
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    type: EntityType;
  } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Normalize data ──────────────────────────────────────────────

  const normalizedEntities = useMemo<NormalizedEntity[]>(() => {
    const list: NormalizedEntity[] = [];

    // Centers
    centers.forEach((c: any) => {
      // Determine status
      let status: VerificationStatus = "pending";
      if (c.status === "verified" || c.verified === true) status = "verified";
      else if (c.status === "rejected" || c.rejected === true)
        status = "rejected";
      else if (c.status === "pending" || c.verified === false)
        status = "pending";

      list.push({
        id: c.centerId || c.id || c._id,
        name: c.centerName || c.name || "Unnamed Center",
        type: "center",
        status,
        email: c.email || c.ownerInfo?.email || "",
        phone: c.phone || c.ownerInfo?.phone || "",
        createdAt: c.createdAt || c.created_at,
        rejectionReason: c.rejectionReason || c.rejection_reason,
        raw: c,
      });
    });

    // Medics
    medics.forEach((m: any) => {
      const firstName = m.personalInfo?.firstName || "";
      const lastName = m.personalInfo?.lastName || "";
      const fullName =
        `${firstName} ${lastName}`.trim() || m.name || "Unnamed Medic";

      let status: VerificationStatus = "pending";
      if (m.credentials?.status === "verified" || m.verified === true)
        status = "verified";
      else if (m.credentials?.status === "rejected" || m.rejected === true)
        status = "rejected";
      else if (m.credentials?.status === "pending" || m.verified === false)
        status = "pending";

      list.push({
        id: m.id || m._id,
        name: fullName,
        type: "medic",
        status,
        email: m.personalInfo?.email || m.email || "",
        phone: m.personalInfo?.phone || m.phone || "",
        createdAt: m.createdAt || m.created_at,
        rejectionReason: m.credentials?.rejectionReason || m.rejectionReason,
        raw: m,
      });
    });

    return list;
  }, [centers, medics]);

  // ─── Filtering ──────────────────────────────────────────────────

  const filteredEntities = useMemo(() => {
    let result = normalizedEntities.filter((e) => e.status === activeTab);

    if (filterType !== "all") {
      result = result.filter((e) => e.type === filterType);
    }

    if (
      selectedRoleId !== "all" &&
      (filterType === "all" || filterType === "medic")
    ) {
      result = result.filter((e) => {
        if (e.type === "medic") {
          const role = getRoleFromString(
            e.raw.professionalInfo?.role,
            e.raw.specialty || e.raw.personalInfo?.specialty,
          );
          return role.id === selectedRoleId;
        }
        return true;
      });
    }

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          e.phone.includes(term),
      );
    }
    return result;
  }, [normalizedEntities, activeTab, filterType, selectedRoleId, search]);

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = normalizedEntities.length;
    const pending = normalizedEntities.filter(
      (e) => e.status === "pending",
    ).length;
    const verified = normalizedEntities.filter(
      (e) => e.status === "verified",
    ).length;
    const rejected = normalizedEntities.filter(
      (e) => e.status === "rejected",
    ).length;
    return { total, pending, verified, rejected };
  }, [normalizedEntities]);

  // ─── Actions ────────────────────────────────────────────────────

  const handleVerify = async (id: string, type: EntityType) => {
    setIsSubmitting(true);
    try {
      const endpoint =
        type === "center" ? "/api/doza-centers" : "/api/doza-medics";
      await apiPut(`${endpoint}?${type}Id=${id}`, {
        verified: true,
        status: "verified",
      });
      refetchCenters();
      refetchMedics();
    } catch (err) {
      alert("Failed to verify. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id: string, type: EntityType, reason: string) => {
    setIsSubmitting(true);
    try {
      const endpoint =
        type === "center" ? "/api/doza-centers" : "/api/doza-medics";
      await apiPut(`${endpoint}?${type}Id=${id}`, {
        verified: false,
        status: "rejected",
        rejectionReason: reason,
      });
      refetchCenters();
      refetchMedics();
      setShowRejectModal(false);
      setSelectedEntity(null);
    } catch (err) {
      alert("Failed to reject. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectModal = (id: string, type: EntityType) => {
    setSelectedEntity({ id, type });
    setShowRejectModal(true);
  };

  const openDetailModal = (id: string, type: EntityType) => {
    setSelectedEntity({ id, type });
    setShowDetailModal(true);
  };

  const handleRefresh = () => {
    refetchCenters();
    refetchMedics();
  };

  const getEntityForModal = () => {
    if (!selectedEntity) return null;
    return (
      normalizedEntities.find(
        (e) => e.id === selectedEntity.id && e.type === selectedEntity.type,
      ) || null
    );
  };

  // ─── Loading ──────────────────────────────────────────────────

  if (centersLoading || medicsLoading) {
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
        </div>
      </div>
    );
  }

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
            Verification Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Review and verify centers and medics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={UsersIcon}
          color="bg-slate-500"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Verified"
          value={stats.verified}
          icon={CheckCircle}
          color="bg-emerald-500"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="bg-rose-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "center", "medic"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all",
                  filterType === type
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {type === "all" ? "All" : type + "s"}
              </button>
            ))}
          </div>
          {(filterType === "all" || filterType === "medic") && (
            <RoleDropdown
              selected={selectedRoleId}
              onChange={setSelectedRoleId}
            />
          )}
        </div>
        <div className="flex gap-2 mt-4 border-t border-slate-100 pt-4 flex-wrap">
          {(["pending", "verified", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize",
                activeTab === status
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-transparent text-slate-500 hover:bg-slate-100",
              )}
            >
              {status}
              <span className="ml-2 text-xs font-normal opacity-60">
                ({filteredEntities.filter((e) => e.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Entity List */}
      <div className="space-y-3">
        {filteredEntities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">
              No {activeTab} entities
            </h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {activeTab === "pending"
                ? "All centers and medics have been reviewed."
                : activeTab === "verified"
                  ? "No verified entities found."
                  : "No rejected entities."}
            </p>
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const isMedic = entity.type === "medic";
            const role = isMedic
              ? getRoleFromString(
                  entity.raw.professionalInfo?.role,
                  entity.raw.specialty || entity.raw.personalInfo?.specialty,
                )
              : null;
            const qualifications =
              entity.raw.professionalInfo?.qualifications || [];
            const firstQual =
              qualifications.length > 0 ? qualifications[0] : null;

            return (
              <motion.div
                key={`${entity.type}-${entity.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EntityIcon type={entity.type} />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {entity.type}
                      </span>
                      {isMedic && role && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {role.title}
                        </span>
                      )}
                      {isMedic && firstQual && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {firstQual}
                        </span>
                      )}
                      <StatusBadge status={entity.status} />
                      {entity.status === "rejected" &&
                        entity.rejectionReason && (
                          <span
                            className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 truncate max-w-[150px]"
                            title={entity.rejectionReason}
                          >
                            {entity.rejectionReason.length > 20
                              ? entity.rejectionReason.slice(0, 20) + "…"
                              : entity.rejectionReason}
                          </span>
                        )}
                    </div>
                    <h3
                      className={cn(
                        "text-lg font-bold text-slate-900 mt-1",
                        bebasNeue.className,
                      )}
                    >
                      {entity.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {entity.email || "N/A"}
                        </span>
                      </span>
                      <span className="hidden sm:block text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{entity.phone || "N/A"}</span>
                      </span>
                      {entity.createdAt && (
                        <>
                          <span className="hidden sm:block text-slate-300">
                            |
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Joined {formatDate(entity.createdAt)}</span>
                          </span>
                        </>
                      )}
                    </div>
                    <ContactButtons email={entity.email} phone={entity.phone} />
                  </div>

                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => openDetailModal(entity.id, entity.type)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={() => handleVerify(entity.id, entity.type)}
                          disabled={isSubmitting}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Verify</span>
                        </button>
                        <button
                          onClick={() =>
                            openRejectModal(entity.id, entity.type)
                          }
                          disabled={isSubmitting}
                          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && selectedEntity && (
          <RejectionModal
            entityName={
              normalizedEntities.find(
                (e) =>
                  e.id === selectedEntity.id && e.type === selectedEntity.type,
              )?.name || "Entity"
            }
            entityType={selectedEntity.type}
            onConfirm={(reason) =>
              handleReject(selectedEntity.id, selectedEntity.type, reason)
            }
            onCancel={() => {
              setShowRejectModal(false);
              setSelectedEntity(null);
            }}
            isLoading={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedEntity && (
          <EntityDetailModal
            entity={getEntityForModal()!}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedEntity(null);
            }}
            onVerify={(id, type) => {
              handleVerify(id, type);
              setShowDetailModal(false);
            }}
            onReject={(id, type) => {
              openRejectModal(id, type);
              setShowDetailModal(false);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
