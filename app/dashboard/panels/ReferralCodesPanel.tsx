// app/dashboard/components/panels/admin/ReferralCodesPanel.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Percent,
  Tag,
  AlertCircle,
  Clock,
  Eye,
  User,
  Building2,
  Stethoscope,
  Gift,
  Coins,
  DollarSign,
  ChevronDown,
  Shuffle,
  Edit,
  Bell,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useReferralCodes } from "../hooks/useReferralCodes";
import { useAuth } from "@/app/utils/AuthContext";
import { apiFetch, apiPut } from "@/app/lib/api";

// ─── Types ──────────────────────────────────────────────────────────

interface ReferralCode {
  id: string;
  code: string;
  assignedToType: "center" | "medic" | "user";
  assignedToId: string;
  assignedToName?: string;
  rewardType: "discount" | "points" | "cashback";
  rewardValue: number;
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
  description?: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

interface Entity {
  id: string;
  name: string;
  type: "center" | "medic" | "user";
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

const StatusBadge = ({ code }: { code: ReferralCode }) => {
  const isExpired = code.expiresAt
    ? new Date(code.expiresAt) < new Date()
    : false;
  const isActive =
    !isExpired &&
    (code.usageLimit === undefined || code.usageCount < code.usageLimit);

  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-700">
        <XCircle className="w-3 h-3" />
        {isExpired ? "Expired" : "Exhausted"}
      </span>
    );
  }
};

const AssignedToIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "center":
      return <Building2 className="w-3.5 h-3.5" />;
    case "medic":
      return <Stethoscope className="w-3.5 h-3.5" />;
    default:
      return <User className="w-3.5 h-3.5" />;
  }
};

const RewardIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "discount":
      return <Percent className="w-3.5 h-3.5" />;
    case "points":
      return <Coins className="w-3.5 h-3.5" />;
    case "cashback":
      return <DollarSign className="w-3.5 h-3.5" />;
    default:
      return <Gift className="w-3.5 h-3.5" />;
  }
};

const formatDate = (iso?: string) => {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Countdown Timer ───────────────────────────────────────────────

const CountdownTimer = ({ expiresAt }: { expiresAt?: string }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !expiresAt) {
      if (!expiresAt) setTimeLeft("No expiry");
      return;
    }

    const update = () => {
      const now = new Date().getTime();
      const target = new Date(expiresAt).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    };

    update();
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [expiresAt, mounted]);

  // Show placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  if (timeLeft === null) {
    return <span className="text-xs text-slate-400">Calculating...</span>;
  }
  return <span className="text-xs font-mono text-slate-500">{timeLeft}</span>;
};

// ─── Reward Type Dropdown ──────────────────────────────────────────

interface RewardTypeSelectProps {
  value: "discount" | "points" | "cashback";
  onChange: (value: "discount" | "points" | "cashback") => void;
  disabled?: boolean;
  className?: string;
}

const RewardTypeSelect: React.FC<RewardTypeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options: {
    value: "discount" | "points" | "cashback";
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "discount",
      label: "Discount (%)",
      icon: <Percent className="w-4 h-4" />,
    },
    { value: "points", label: "Points", icon: <Coins className="w-4 h-4" /> },
    {
      value: "cashback",
      label: "Cashback (₦)",
      icon: <DollarSign className="w-4 h-4" />,
    },
  ];

  const selected = options.find((o) => o.value === value);

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

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 transition-all text-left flex items-center justify-between",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="flex items-center gap-2">
          {selected?.icon}
          {selected?.label}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 transition-colors",
                value === opt.value && "bg-emerald-50 text-emerald-700",
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Searchable Dropdown ──────────────────────────────────────────

interface SearchableSelectProps {
  entities: Entity[];
  value: string;
  onChange: (entityId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  filterType?: "center" | "medic" | "user" | "all";
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  entities,
  value,
  onChange,
  placeholder = "Select a center, medic, or user",
  disabled = false,
  className = "",
  error = false,
  filterType = "all",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredEntities = useMemo(() => {
    if (filterType === "all") return entities;
    return entities.filter((e) => e.type === filterType);
  }, [entities, filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, Entity[]> = {};
    filteredEntities.forEach((e) => {
      if (!groups[e.type]) groups[e.type] = [];
      groups[e.type].push(e);
    });
    return groups;
  }, [filteredEntities]);

  const filteredGroups = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return grouped;
    const result: Record<string, Entity[]> = {};
    Object.entries(grouped).forEach(([type, list]) => {
      const filtered = list.filter((e) => e.name.toLowerCase().includes(term));
      if (filtered.length > 0) result[type] = filtered;
    });
    return result;
  }, [grouped, search]);

  const selectedEntity = entities.find((e) => e.id === value);

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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (entityId: string) => {
    onChange(entityId);
    setIsOpen(false);
    setSearch("");
  };

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      if (!isOpen) setSearch("");
    }
  };

  const displayName = selectedEntity
    ? `${selectedEntity.type.charAt(0).toUpperCase() + selectedEntity.type.slice(1)}: ${selectedEntity.name}`
    : placeholder;

  const totalCount = filteredEntities.length;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 bg-slate-50/80 border rounded-xl text-sm text-slate-800 transition-all text-left flex items-center justify-between",
          error ? "border-red-200 bg-red-50/30" : "border-slate-200",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selectedEntity && <AssignedToIcon type={selectedEntity.type} />}
          <span>{displayName}</span>
        </span>
        <div className="flex items-center gap-1">
          {!disabled && (
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
              {totalCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-2xl max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1">
            {Object.keys(filteredGroups).length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500 text-center">
                No matches found
              </div>
            ) : (
              Object.entries(filteredGroups).map(([type, items]) => (
                <div key={type}>
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80">
                    {type === "center"
                      ? "Centers"
                      : type === "medic"
                        ? "Medics"
                        : "Users"}
                  </div>
                  {items.map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => handleSelect(entity.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 transition-colors text-left",
                        value === entity.id && "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      <AssignedToIcon type={entity.type} />
                      <span className="truncate">{entity.name}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Entity Filter Chips ───────────────────────────────────────────

interface EntityFilterChipsProps {
  currentFilter: "all" | "center" | "medic" | "user";
  onFilterChange: (filter: "all" | "center" | "medic" | "user") => void;
  counts: { center: number; medic: number; user: number };
}

const EntityFilterChips: React.FC<EntityFilterChipsProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  const chips: {
    value: typeof currentFilter;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "all", label: "All", icon: <Users className="w-3.5 h-3.5" /> },
    {
      value: "center",
      label: "Centers",
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
    {
      value: "medic",
      label: "Medics",
      icon: <Stethoscope className="w-3.5 h-3.5" />,
    },
    { value: "user", label: "Users", icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const isActive = currentFilter === chip.value;
        const count =
          chip.value === "all"
            ? counts.center + counts.medic + counts.user
            : counts[chip.value as keyof typeof counts] || 0;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onFilterChange(chip.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all",
              isActive
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60",
            )}
          >
            {chip.icon}
            {chip.label}
            <span
              className={cn(
                "text-[10px] font-bold",
                isActive ? "text-white/80" : "text-slate-400",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Main Panel ──────────────────────────────────────────────────

export default function ReferralCodesPanel() {
  const [mounted, setMounted] = useState(false);
  const { codes, stats, loading, error, refetch, createCode, deleteCode } =
    useReferralCodes();
  const { user } = useAuth();
  const isCEO = true; // temporary

  // ─── Entities ──────────────────────────────────────────────
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [entitiesError, setEntitiesError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<
    "all" | "center" | "medic" | "user"
  >("all");

  // ─── Create Form ───────────────────────────────────────────
  const [newCode, setNewCode] = useState({
    code: "",
    assignedToType: "center" as "center" | "medic" | "user",
    assignedToId: "",
    assignedToName: "",
    rewardType: "discount" as "discount" | "points" | "cashback",
    rewardValue: 10,
    expiresAt: "",
    usageLimit: "",
    description: "",
    autoGenerate: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // ─── Search & Modals ───────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCode, setSelectedCode] = useState<ReferralCode | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // ─── Edit Modal ────────────────────────────────────────────
  const [editCodeData, setEditCodeData] = useState<ReferralCode | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // ─── Auto‑generate ──────────────────────────────────────────
  const generateRandomCode = () => {
    const prefix = "DOZA";
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${random}`;
  };

  useEffect(() => {
    if (newCode.autoGenerate && !newCode.code) {
      setNewCode((prev) => ({ ...prev, code: generateRandomCode() }));
    }
  }, [newCode.autoGenerate]);

  useEffect(() => {
    if (newCode.autoGenerate && !newCode.code) {
      setNewCode((prev) => ({ ...prev, code: generateRandomCode() }));
    }
  }, []);

  // ─── Entity Counts & Map ──────────────────────────────────
  const entityCounts = useMemo(() => {
    const counts = { center: 0, medic: 0, user: 0 };
    entities.forEach((e) => {
      if (counts[e.type] !== undefined) counts[e.type]++;
    });
    return counts;
  }, [entities]);

  const entityMap = useMemo(() => {
    const map: Record<string, { name: string; type: string }> = {};
    entities.forEach((e) => {
      map[e.id] = { name: e.name, type: e.type };
    });
    return map;
  }, [entities]);

  // ─── Fetch Entities ────────────────────────────────────────
  useEffect(() => {
    const fetchEntities = async () => {
      setLoadingEntities(true);
      setEntitiesError(null);
      try {
        const data = await apiFetch("/api/entities");
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => {
            let displayName = item.name;
            if (item.firstName && item.lastName) {
              displayName = `${item.firstName} ${item.lastName}`.trim();
            } else if (item.fullName) {
              displayName = item.fullName;
            } else if (item.name && !item.name.includes("@")) {
              displayName = item.name;
            } else {
              const emailPart = item.email || item.name;
              if (emailPart && emailPart.includes("@")) {
                const prefix = emailPart.split("@")[0];
                displayName = prefix
                  .replace(/[._-]/g, " ")
                  .replace(/\b\w/g, (l: string) => l.toUpperCase());
              } else {
                displayName = item.name || "Unnamed";
              }
            }
            return { ...item, name: displayName };
          });
          setEntities(mapped);
          if (mapped.length === 0) {
            setEntitiesError("No centers, medics, or users found.");
          }
        } else {
          console.warn("Entities endpoint fallback to mock");
          setEntities([
            { id: "center1", name: "Downtown Center", type: "center" },
            { id: "medic1", name: "Dr. Smith", type: "medic" },
            { id: "user1", name: "John Doe", type: "user" },
          ]);
        }
      } catch (err: any) {
        console.error("Entities fetch error, using mock", err);
        setEntities([
          { id: "center1", name: "Downtown Center", type: "center" },
          { id: "medic1", name: "Dr. Smith", type: "medic" },
          { id: "user1", name: "John Doe", type: "user" },
        ]);
      } finally {
        setLoadingEntities(false);
      }
    };
    fetchEntities();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleEntitySelect = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId);
    if (entity) {
      setNewCode({
        ...newCode,
        assignedToType: entity.type,
        assignedToId: entity.id,
        assignedToName: entity.name,
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreating(true);

    try {
      let finalCode = newCode.code.trim();
      if (newCode.autoGenerate && !finalCode) {
        finalCode = generateRandomCode();
      }
      if (!finalCode) {
        setCreateError("Please enter a code or enable auto‑generation.");
        setIsCreating(false);
        return;
      }

      const existingCode = codes.find((c) => c.code === finalCode);
      if (existingCode) {
        setCreateError("Code already exists.");
        setIsCreating(false);
        return;
      }

      const payload = {
        ...newCode,
        code: finalCode,
        usageLimit: newCode.usageLimit
          ? parseInt(newCode.usageLimit)
          : undefined,
      };

      // createCode throws on HTTP error; if it resolves, it's successful
      await createCode(payload);

      setCreateSuccess(`Referral code "${finalCode}" created!`);
      setNewCode({
        code: generateRandomCode(),
        assignedToType: "center",
        assignedToId: "",
        assignedToName: "",
        rewardType: "discount",
        rewardValue: 10,
        expiresAt: "",
        usageLimit: "",
        description: "",
        autoGenerate: true,
      });
      await refetch();
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      console.error("Create error:", err);
      setCreateError(err.message || "Failed to create");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this referral code?")) {
      await deleteCode(id);
      await refetch();
    }
  };

  const handleCopy = (code: string) => {
    if (navigator.clipboard && document.hasFocus()) {
      navigator.clipboard
        .writeText(code)
        .then(() => alert("Copied!"))
        .catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  };

  const fallbackCopy = (code: string) => {
    const input = document.createElement("input");
    input.value = code;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      alert("Copied!");
    } catch {
      prompt("Copy manually:", code);
    }
    document.body.removeChild(input);
  };

  // ─── Usage Modal ──────────────────────────────────────────────
  const handleViewUsage = async (code: ReferralCode) => {
    setSelectedCode(code);
    setShowUsageModal(true);
    setLoadingUsage(true);
    try {
      const res = await fetch(`/api/referral-usage?codeId=${code.id}`);
      const json = await res.json();
      setUsageLogs(json.success ? json.data : []);
    } catch (err) {
      console.error("Usage fetch error:", err);
      setUsageLogs([]);
    } finally {
      setLoadingUsage(false);
    }
  };

  // ─── Edit Modal ──────────────────────────────────────────────
  const handleEditClick = (code: ReferralCode) => {
    setEditCodeData({ ...code });
    setShowEditModal(true);
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCodeData) return;
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const payload = {
        rewardType: editCodeData.rewardType,
        rewardValue: editCodeData.rewardValue,
        expiresAt: editCodeData.expiresAt || undefined,
        usageLimit: editCodeData.usageLimit || undefined,
        description: editCodeData.description || undefined,
      };
      await apiPut(`/api/referral-codes`, { id: editCodeData.id, ...payload });
      setUpdateSuccess("Updated successfully!");
      await refetch();
      setTimeout(() => {
        setUpdateSuccess(null);
        setShowEditModal(false);
      }, 1500);
    } catch (err: any) {
      setUpdateError(err.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Notify ──────────────────────────────────────────────────
  const handleNotify = async (code: ReferralCode) => {
    try {
      const res = await fetch("/api/notify-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeId: code.id,
          assignedToId: code.assignedToId,
          assignedToType: code.assignedToType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Notification sent!");
      } else {
        alert("Failed: " + data.error);
      }
    } catch (err) {
      alert("Error sending notification");
    }
  };

  // ─── Filter ──────────────────────────────────────────────────
  const filteredCodes = codes.filter(
    (code: ReferralCode) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entityMap[code.assignedToId]?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  // ─── Loading ──────────────────────────────────────────────────
  if (!mounted || loading) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
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
          Failed to load
        </h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl"
        >
          Retry
        </button>
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
            Referral Codes
          </h1>
          <p className="text-sm text-slate-500">
            Create and manage referral codes for centers, medics, and users
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Codes"
          value={stats.total}
          icon={Tag}
          color="bg-emerald-500"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle}
          color="bg-blue-500"
        />
        <StatCard
          label="Expired"
          value={stats.expired}
          icon={Clock}
          color="bg-rose-500"
        />
        <StatCard
          label="Total Usage"
          value={stats.totalUsage}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          label="Avg Reward"
          value={stats.avgReward || 0}
          icon={Gift}
          color="bg-amber-500"
        />
      </div>

      {/* Create Form (CEO only) */}
      {isCEO && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {createSuccess}
              </div>
            )}
            {entitiesError && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 text-sm">
                ⚠️ {entitiesError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      newCode.autoGenerate ? "Auto‑generated" : "Enter code"
                    }
                    value={newCode.code}
                    onChange={(e) =>
                      setNewCode({
                        ...newCode,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={newCode.autoGenerate}
                    className="flex-1 px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewCode({
                        ...newCode,
                        autoGenerate: !newCode.autoGenerate,
                      })
                    }
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      newCode.autoGenerate
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500",
                    )}
                    title="Toggle auto‑generate"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Assign To <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <EntityFilterChips
                    currentFilter={entityFilter}
                    onFilterChange={setEntityFilter}
                    counts={entityCounts}
                  />
                  <SearchableSelect
                    entities={entities}
                    value={newCode.assignedToId}
                    onChange={handleEntitySelect}
                    placeholder="Search and select..."
                    disabled={loadingEntities || !!entitiesError}
                    error={!newCode.assignedToId && !!createError}
                    filterType={entityFilter}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Reward Type
                </label>
                <RewardTypeSelect
                  value={newCode.rewardType}
                  onChange={(val) =>
                    setNewCode({ ...newCode, rewardType: val })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Reward Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newCode.rewardValue}
                  onChange={(e) =>
                    setNewCode({
                      ...newCode,
                      rewardValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Expires At
                </label>
                <input
                  type="date"
                  value={newCode.expiresAt}
                  onChange={(e) =>
                    setNewCode({ ...newCode, expiresAt: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 100"
                  value={newCode.usageLimit}
                  onChange={(e) =>
                    setNewCode({ ...newCode, usageLimit: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summer campaign"
                  value={newCode.description}
                  onChange={(e) =>
                    setNewCode({ ...newCode, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating || !newCode.assignedToId || loadingEntities}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? "Creating..." : "Create Code"}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code, description, or assigned name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expires / Countdown
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {searchTerm ? "No matches" : "No codes yet"}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code: ReferralCode) => {
                  let displayName = code.assignedToName;
                  if (!displayName && entityMap[code.assignedToId]) {
                    displayName = entityMap[code.assignedToId].name;
                  }
                  if (!displayName) {
                    displayName = `${code.assignedToType} #${code.assignedToId.slice(0, 6)}`;
                  }
                  return (
                    <motion.tr
                      key={code.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-emerald-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-sm font-medium text-slate-800">
                        {code.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <AssignedToIcon type={code.assignedToType} />
                          <span className="text-slate-600">{displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <RewardIcon type={code.rewardType} />
                          {code.rewardValue}
                          {code.rewardType === "discount" && "%"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(code.expiresAt)}
                          </div>
                          <CountdownTimer expiresAt={code.expiresAt} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {code.usageCount || 0}
                          {code.usageLimit !== undefined && (
                            <span className="text-slate-400 text-xs">
                              {" "}
                              / {code.usageLimit}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge code={code} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewUsage(code)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            title="View usage"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopy(code.code)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {isCEO && (
                            <>
                              <button
                                onClick={() => handleEditClick(code)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                                title="Edit code"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleNotify(code)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                                title="Notify assigned user"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(code.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Delete code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Usage Modal ────────────────────────────────────────── */}
      {showUsageModal && selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Usage – {selectedCode.code}
              </h3>
              <button
                onClick={() => setShowUsageModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {loadingUsage ? (
                <div className="text-center py-8 text-slate-500">
                  Loading...
                </div>
              ) : usageLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No usage recorded
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left">Used By</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageLogs.map((log, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-3 py-2">{log.usedBy}</td>
                        <td className="px-3 py-2">{log.usedByType}</td>
                        <td className="px-3 py-2">{formatDate(log.usedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ────────────────────────────────────────── */}
      {showEditModal && editCodeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3
              className={cn(
                "text-xl font-bold text-slate-800 mb-4",
                bebasNeue.className,
              )}
            >
              Edit Referral Code
            </h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={editCodeData.code}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Reward Type
                </label>
                <RewardTypeSelect
                  value={editCodeData.rewardType}
                  onChange={(val) =>
                    setEditCodeData({ ...editCodeData, rewardType: val })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Reward Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editCodeData.rewardValue}
                  onChange={(e) =>
                    setEditCodeData({
                      ...editCodeData,
                      rewardValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Expires At
                </label>
                <input
                  type="date"
                  value={editCodeData.expiresAt || ""}
                  onChange={(e) =>
                    setEditCodeData({
                      ...editCodeData,
                      expiresAt: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={editCodeData.usageLimit ?? ""}
                  onChange={(e) =>
                    setEditCodeData({
                      ...editCodeData,
                      usageLimit: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Description"
                  value={editCodeData.description || ""}
                  onChange={(e) =>
                    setEditCodeData({
                      ...editCodeData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>

              {updateError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                  {updateError}
                </div>
              )}
              {updateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm">
                  {updateSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
