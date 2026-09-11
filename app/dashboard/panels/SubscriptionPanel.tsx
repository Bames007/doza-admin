"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  DndContext,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { usePackages, Package } from "../hooks/usePackages";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useCenters } from "../hooks/useCenters";
import { useMedics } from "../hooks/useMedics";
import { useUsers } from "../hooks/useUsers";
import { useAuth } from "@/app/utils/AuthContext";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import * as LucideIcons from "lucide-react";
import {
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Users as UsersIcon,
  Building2,
  Stethoscope,
  User,
  X,
  AlertCircle,
  Move,
  Package as PackageIcon,
  Info,
} from "lucide-react";

// ─── Icons ──────────────────────────────────────────────────────

const ICON_LIST = [
  "ShieldCheck",
  "Crown",
  "Award",
  "Briefcase",
  "Layers",
  "Tag",
  "CreditCard",
  "Package",
  "HeartHandshake",
  "Zap",
  "Lock",
  "Compass",
  "Gem",
  "Globe",
  "CheckCircle2",
];

// ─── Helpers ──────────────────────────────────────────────────────

const groupPackagesByCategory = (
  packages: Package[],
): Record<string, Package[]> => {
  const groups: Record<string, Package[]> = {};
  packages.forEach((pkg) => {
    const cat = pkg.category || "Uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(pkg);
  });
  return groups;
};

// ─── Package Form Modal (fully accessible) ─────────────────────

interface PackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Partial<Package>;
  title: string;
  isLoading: boolean;
}

const PackageFormModal: React.FC<PackageFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  title,
  isLoading,
}) => {
  const [name, setName] = useState(initialData.name || "");
  const [entityType, setEntityType] = useState<"center" | "medic" | "user">(
    initialData.entityType || "center",
  );
  const [category, setCategory] = useState(initialData.category || "");
  const [price, setPrice] = useState<number>(initialData.price || 0);
  const [icon, setIcon] = useState(initialData.icon || "Package");
  const [benefits, setBenefits] = useState<
    { name: string; description?: string }[]
  >(initialData.benefits || []);
  const [benefitName, setBenefitName] = useState("");
  const [benefitDescription, setBenefitDescription] = useState("");
  const [description, setDescription] = useState(initialData.description || "");
  const [addError, setAddError] = useState<string>("");

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Focus management & escape key
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const announce = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      setTimeout(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = "";
      }, 2000);
    }
  };

  const handleAddBenefit = () => {
    if (!benefitName.trim()) {
      setAddError("Benefit name is required.");
      announce("Benefit name is required.");
      return;
    }
    setAddError("");
    setBenefits([
      ...benefits,
      {
        name: benefitName.trim(),
        description: benefitDescription.trim() || undefined,
      },
    ]);
    setBenefitName("");
    setBenefitDescription("");
    announce("Benefit added");
  };

  const handleRemoveBenefit = (index: number) => {
    const removed = benefits[index]?.name || "Benefit";
    setBenefits(benefits.filter((_, i) => i !== index));
    announce(`${removed} removed`);
  };

  const handleUpdateBenefit = (
    index: number,
    field: "name" | "description",
    value: string,
  ) => {
    const updated = [...benefits];
    updated[index] = { ...updated[index], [field]: value };
    setBenefits(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      entityType,
      category,
      price,
      icon,
      benefits,
      description,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3
            id="modal-title"
            className={cn(
              "text-2xl font-bold tracking-wide text-slate-900",
              bebasNeue.className,
            )}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live region for announcements */}
        <div
          ref={liveRegionRef}
          role="status"
          aria-live="polite"
          className="sr-only"
        />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Package Name */}
          <div>
            <label
              htmlFor="package-name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Package Name *
            </label>
            <input
              ref={firstInputRef}
              id="package-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Entity Type */}
          <div>
            <label
              htmlFor="entity-type"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Entity Type *
            </label>
            <select
              id="entity-type"
              value={entityType}
              onChange={(e) =>
                setEntityType(e.target.value as "center" | "medic" | "user")
              }
              required
              aria-required="true"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all shadow-sm"
            >
              <option value="center">Center</option>
              <option value="medic">Medic</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Category *
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              aria-required="true"
              placeholder="e.g., Free, Premium, Enterprise"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Price (₦) *
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="100"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
              aria-required="true"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Icon */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Icon
            </legend>
            <div
              className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50"
              role="radiogroup"
              aria-label="Icon selection"
            >
              {ICON_LIST.map((iconName) => {
                const Icon = (LucideIcons as any)[iconName];
                if (!Icon) return null;
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    role="radio"
                    aria-checked={isSelected}
                    className={cn(
                      "p-2.5 rounded-lg border flex items-center justify-center transition-all focus:ring-2 focus:ring-emerald-500",
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-100 text-slate-600",
                    )}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Benefits */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Benefits with Descriptions
            </label>

            <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl shadow-inner">
              {benefits.length > 0 && (
                <ul className="space-y-2.5" role="list">
                  {benefits.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex-1 space-y-2">
                        <div>
                          <label
                            htmlFor={`benefit-name-${i}`}
                            className="block text-[11px] font-semibold text-slate-600 mb-1"
                          >
                            Benefit Name{" "}
                            <span className="text-rose-600">*</span>
                          </label>
                          <input
                            id={`benefit-name-${i}`}
                            type="text"
                            value={b.name}
                            onChange={(e) =>
                              handleUpdateBenefit(i, "name", e.target.value)
                            }
                            placeholder="e.g., Priority Support"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-sm transition-all"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`benefit-desc-${i}`}
                            className="block text-[11px] font-semibold text-slate-600 mb-1"
                          >
                            Description{" "}
                            <span className="text-slate-400 font-normal">
                              (Optional)
                            </span>
                          </label>
                          <input
                            id={`benefit-desc-${i}`}
                            type="text"
                            value={b.description || ""}
                            onChange={(e) =>
                              handleUpdateBenefit(
                                i,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Brief description of what this includes"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-sm transition-all"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(i)}
                        className="mt-6 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors focus:ring-2 focus:ring-rose-500 outline-none"
                        aria-label={`Remove benefit ${b.name || i + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <fieldset className="border-t border-slate-200/80 pt-4 mt-2">
                <legend className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                  Add New Benefit
                </legend>
                <div className="flex flex-col sm:flex-row gap-2.5 items-start">
                  <div className="flex-1 w-full space-y-2.5">
                    <div>
                      <label htmlFor="new-benefit-name" className="sr-only">
                        New benefit name
                      </label>
                      <input
                        id="new-benefit-name"
                        type="text"
                        value={benefitName}
                        onChange={(e) => {
                          setBenefitName(e.target.value);
                          if (addError) setAddError("");
                        }}
                        placeholder="Benefit name *"
                        aria-describedby={
                          addError ? "benefit-error" : undefined
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-sm transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-benefit-desc" className="sr-only">
                        New benefit description
                      </label>
                      <input
                        id="new-benefit-desc"
                        type="text"
                        value={benefitDescription}
                        onChange={(e) => setBenefitDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-sm transition-all"
                      />
                    </div>
                    {addError && (
                      <div
                        id="benefit-error"
                        role="alert"
                        className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1"
                      >
                        <span>{addError}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-600 outline-none flex items-center justify-center gap-2 font-semibold text-sm"
                    aria-label="Add benefit"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Add</span>
                  </button>
                </div>
              </fieldset>
            </div>
          </div>

          {/* Package Description */}
          <div>
            <label
              htmlFor="package-description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Package Description
            </label>
            <textarea
              id="package-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none resize-none shadow-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-500"
            >
              {isLoading ? "Saving..." : "Save Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Draggable Package Card (fully accessible) ────────────────

interface PackageCardProps {
  pkg: Package;
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
  onViewSubscribers: (pkg: Package) => void;
}

const DraggablePackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onEdit,
  onDelete,
  onViewSubscribers,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: pkg.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon =
    pkg.icon && (LucideIcons as any)[pkg.icon]
      ? (LucideIcons as any)[pkg.icon]
      : PackageIcon;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition-all group",
        isDragging && "opacity-40 shadow-xl border-emerald-500",
      )}
      aria-grabbed={isDragging}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shadow-sm"
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">{pkg.name}</h4>
            <span className="inline-block mt-0.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full capitalize">
              {pkg.category}
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200/60 rounded-xl"
          role="group"
          aria-label="Package actions"
        >
          <button
            onClick={() => onEdit(pkg)}
            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors focus:ring-2 focus:ring-amber-500"
            aria-label={`Edit package ${pkg.name}`}
          >
            <Edit className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(pkg.id)}
            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors focus:ring-2 focus:ring-rose-500"
            aria-label={`Delete package ${pkg.name}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1.5 text-slate-400 hover:text-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-lg"
            role="button"
            aria-label={`Drag package ${pkg.name}`}
            tabIndex={0}
          >
            <Move className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xl font-extrabold text-emerald-700 tracking-tight">
          ₦{pkg.price.toLocaleString()}
        </p>
        {pkg.benefits && pkg.benefits.length > 0 && (
          <ul
            className="mt-2.5 flex flex-wrap gap-1.5"
            aria-label="Package benefits"
          >
            {pkg.benefits.slice(0, 2).map((benefit, i) => (
              <li
                key={i}
                className="relative inline-flex items-center gap-1 text-xs font-medium bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 cursor-help group"
                title={benefit.description || benefit.name}
              >
                {benefit.name}
                {benefit.description && (
                  <>
                    <Info
                      className="w-3 h-3 text-slate-400"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{benefit.description}</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {benefit.description}
                    </span>
                  </>
                )}
              </li>
            ))}
            {pkg.benefits.length > 2 && (
              <li className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                +{pkg.benefits.length - 2} more
              </li>
            )}
          </ul>
        )}
      </div>
      <button
        onClick={() => onViewSubscribers(pkg)}
        className="mt-4 w-full py-2 px-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs focus:ring-2 focus:ring-emerald-500"
        aria-label={`View subscribers for ${pkg.name}`}
      >
        <UsersIcon className="w-3.5 h-3.5" aria-hidden="true" /> View Active
        Subscribers
      </button>
    </article>
  );
};

// ─── Column (Droppable) ──────────────────────────────────────────

interface ColumnProps {
  category: string;
  packages: Package[];
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
  onViewSubscribers: (pkg: Package) => void;
}

const Column: React.FC<ColumnProps> = ({
  category,
  packages,
  onEdit,
  onDelete,
  onViewSubscribers,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: category });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "bg-slate-100/70 backdrop-blur-sm rounded-3xl p-5 border border-slate-200 shadow-xs min-h-[350px] w-full flex flex-col transition-colors",
        isOver && "bg-emerald-50/80 border-emerald-300",
      )}
      aria-label={`${category} column`}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80">
        <h3
          className={cn(
            "text-base font-bold text-slate-800 tracking-wide uppercase",
            bebasNeue.className,
          )}
        >
          {category}
        </h3>
        <span
          className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-xs"
          aria-label={`${packages.length} packages`}
        >
          {packages.length}
        </span>
      </div>
      <div className="space-y-3.5 flex-1" role="list">
        {packages.map((pkg) => (
          <div key={pkg.id} role="listitem">
            <DraggablePackageCard
              pkg={pkg}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewSubscribers={onViewSubscribers}
            />
          </div>
        ))}
        {packages.length === 0 && (
          <div
            className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl"
            aria-label="Empty column"
          >
            <p className="text-sm font-medium text-slate-500">
              No packages in this column
            </p>
            <p className="text-xs text-slate-400 mt-1">Drop a package here</p>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Subscriber Modal ──────────────────────────────────────────

interface SubscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: Package | null;
}

const SubscriberModal: React.FC<SubscriberModalProps> = ({
  isOpen,
  onClose,
  packageData,
}) => {
  const { subscriptions, loading, assignEntity } = useSubscriptions(
    packageData?.id,
  );
  const { centers } = useCenters();
  const { medics } = useMedics();
  const { users } = useUsers();

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allEntities = useMemo(() => {
    const list: {
      id: string;
      name: string;
      type: "center" | "medic" | "user";
    }[] = [];
    if (!packageData) return list;

    if (packageData.entityType === "center") {
      centers.forEach((c: any) => {
        list.push({
          id: c.centerId || c.id,
          name: c.centerName || c.name,
          type: "center",
        });
      });
    } else if (packageData.entityType === "medic") {
      medics.forEach((m: any) => {
        const name =
          `${m.personalInfo?.firstName || ""} ${m.personalInfo?.lastName || ""}`.trim() ||
          m.name;
        list.push({ id: m.id, name, type: "medic" });
      });
    } else {
      users.forEach((u: any) => {
        let name = u.fullName || u.name || u.email;
        if (u.personalProfile?.fname || u.personalProfile?.lname) {
          name =
            `${u.personalProfile.fname || ""} ${u.personalProfile.lname || ""}`.trim();
        }
        list.push({ id: u.id, name, type: "user" });
      });
    }
    return list;
  }, [centers, medics, users, packageData]);

  const subscribedIds = useMemo(
    () => new Set(subscriptions.map((s) => s.entityId)),
    [subscriptions],
  );

  const handleToggle = async (
    entityId: string,
    entityType: "center" | "medic" | "user",
  ) => {
    if (!packageData) return;
    const isAssigned = subscribedIds.has(entityId);
    await assignEntity(entityId, entityType, !isAssigned);
  };

  if (!isOpen || !packageData) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscriber-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3
              id="subscriber-modal-title"
              className={cn(
                "text-2xl font-bold text-slate-900 tracking-wide",
                bebasNeue.className,
              )}
            >
              Subscribers – {packageData.name}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Assigning to{" "}
              <span className="text-emerald-700 font-bold">
                {packageData.entityType}
              </span>{" "}
              accounts
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Close subscribers modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div
              className="text-center py-12 text-slate-600 font-medium"
              aria-live="polite"
            >
              Loading subscribers...
            </div>
          ) : (
            <div className="space-y-3" role="list" aria-label="Entity list">
              {allEntities.length === 0 ? (
                <div
                  className="text-center py-12 text-slate-600 font-medium"
                  aria-live="polite"
                >
                  No {packageData.entityType}s found in the system.
                </div>
              ) : (
                allEntities.map((entity) => {
                  const isAssigned = subscribedIds.has(entity.id);
                  return (
                    <div
                      key={`${entity.type}-${entity.id}`}
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all shadow-xs"
                      role="listitem"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2.5 bg-slate-100 rounded-xl text-slate-700"
                          aria-hidden="true"
                        >
                          {entity.type === "center" ? (
                            <Building2 className="w-4 h-4" />
                          ) : entity.type === "medic" ? (
                            <Stethoscope className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {entity.name}
                          </p>
                          <span className="text-xs font-medium text-slate-600 capitalize">
                            {entity.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(entity.id, entity.type)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs focus:ring-2 focus:ring-emerald-500",
                          isAssigned
                            ? "bg-emerald-100 border border-emerald-300 text-emerald-900 hover:bg-emerald-200"
                            : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200",
                        )}
                        aria-label={
                          isAssigned
                            ? `Unassign ${entity.name} from ${packageData.name}`
                            : `Assign ${entity.name} to ${packageData.name}`
                        }
                      >
                        {isAssigned ? "Assigned" : "Assign Package"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Panel ──────────────────────────────────────────────────

export default function SubscriptionPanel() {
  const { user } = useAuth();
  // 🔥 For production: user?.role === "ceo" || user?.role === "admin"
  const isCEO = true; // temporary override

  const {
    packages,
    loading,
    error,
    refetch,
    createPackage,
    updatePackage,
    deletePackage,
  } = usePackages();

  // ─── State ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"center" | "medic" | "user">(
    "center",
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ─── Hooks ─────────────────────────────────────────────────────

  const filteredPackages = useMemo(() => {
    const list = Array.isArray(packages) ? packages : [];
    return list.filter((pkg) => pkg.entityType === activeTab);
  }, [packages, activeTab]);

  const grouped = useMemo(() => {
    const list = Array.isArray(filteredPackages) ? filteredPackages : [];
    const groups = groupPackagesByCategory(list);
    const sortedKeys = Object.keys(groups).sort();
    const result: Record<string, Package[]> = {};
    sortedKeys.forEach((key) => {
      result[key] = groups[key];
    });
    return result;
  }, [filteredPackages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event: KeyboardEvent) => {
        const { key } = event;
        if (key === "ArrowDown") return { x: 0, y: 10 };
        if (key === "ArrowUp") return { x: 0, y: -10 };
        if (key === "ArrowLeft") return { x: -10, y: 0 };
        if (key === "ArrowRight") return { x: 10, y: 0 };
        return undefined;
      },
    }),
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const draggedPkg = packages.find((p) => p.id === active.id);
      if (!draggedPkg) return;
      const overCategory = over.id;
      if (typeof overCategory !== "string") return;
      updatePackage(draggedPkg.id, { category: overCategory });
    },
    [packages, updatePackage],
  );

  const handleCreate = useCallback(
    async (data: any) => {
      setIsSubmitting(true);
      try {
        await createPackage(data);
        setShowCreateModal(false);
        setNotification({
          type: "success",
          message: "Package created successfully!",
        });
        setTimeout(() => setNotification(null), 5000);
      } catch (err: any) {
        setNotification({
          type: "error",
          message: err.message || "Failed to create package.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [createPackage],
  );

  const handleUpdate = useCallback(
    async (data: any) => {
      if (!editingPackage) return;
      setIsSubmitting(true);
      try {
        await updatePackage(editingPackage.id, data);
        setEditingPackage(null);
        setNotification({
          type: "success",
          message: "Package updated successfully!",
        });
        setTimeout(() => setNotification(null), 5000);
      } catch (err: any) {
        setNotification({
          type: "error",
          message: err.message || "Failed to update package.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingPackage, updatePackage],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this package?")) return;
      try {
        await deletePackage(id);
        setNotification({
          type: "success",
          message: "Package deleted successfully!",
        });
        setTimeout(() => setNotification(null), 5000);
      } catch (err: any) {
        setNotification({
          type: "error",
          message: err.message || "Failed to delete package.",
        });
      }
    },
    [deletePackage],
  );

  const handleViewSubscribers = useCallback((pkg: Package) => {
    setSelectedPackage(pkg);
    setShowSubscribersModal(true);
  }, []);

  // ─── Conditional returns ─────────────────────────────────────

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 bg-slate-200 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 text-center"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle
          className="w-12 h-12 text-rose-500 mb-4"
          aria-hidden="true"
        />
        <h2
          className={cn(
            "text-xl font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          Failed to load packages
        </h2>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500"
          aria-label="Retry loading packages"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* Notification */}
      {notification && (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "p-4 rounded-xl text-sm font-medium",
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800",
          )}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Subscription Packages
          </h1>
          <p className="text-sm text-slate-500">
            Manage packages for Centers, Medics, and Users
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Refresh packages"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh
          </button>
          {isCEO && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              aria-label="Create new package"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> New Package
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div
        className="bg-white rounded-2xl p-1 border border-slate-200/80 shadow-sm flex flex-wrap gap-1"
        role="tablist"
        aria-label="Entity type filter"
      >
        {(["center", "medic", "user"] as const).map((type) => {
          const count = packages.filter((p) => p.entityType === type).length;
          const isActive = activeTab === type;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${type}-packages`}
              id={`tab-${type}`}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {type === "center" ? (
                <Building2 className="w-4 h-4" aria-hidden="true" />
              ) : type === "medic" ? (
                <Stethoscope className="w-4 h-4" aria-hidden="true" />
              ) : (
                <User className="w-4 h-4" aria-hidden="true" />
              )}
              {type}s
              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600",
                )}
                aria-label={`${count} packages`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(grouped).length > 0 ? (
            Object.entries(grouped).map(([category, pkgs]) => (
              <div
                key={category}
                className="h-full"
                data-droppable-id={category}
                role="tabpanel"
                id={`${activeTab}-packages`}
                aria-labelledby={`tab-${activeTab}`}
              >
                <Column
                  category={category}
                  packages={pkgs}
                  onEdit={(pkg) => setEditingPackage(pkg)}
                  onDelete={handleDelete}
                  onViewSubscribers={handleViewSubscribers}
                />
              </div>
            ))
          ) : (
            <div
              className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs"
              role="status"
              aria-live="polite"
            >
              <PackageIcon
                className="w-16 h-16 text-slate-300 mb-4"
                aria-hidden="true"
              />
              <h2 className="text-xl font-bold text-slate-800">
                No {activeTab} packages
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Create a package for {activeTab}s to get started.
              </p>
              {isCEO && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-500"
                  aria-label={`Create first ${activeTab} package`}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> Create Package
                </button>
              )}
            </div>
          )}
        </div>
      </DndContext>

      {/* Modals */}
      <PackageFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        title="Create New Package"
        isLoading={isSubmitting}
      />

      {editingPackage && (
        <PackageFormModal
          isOpen={!!editingPackage}
          onClose={() => setEditingPackage(null)}
          onSubmit={handleUpdate}
          title="Edit Package"
          isLoading={isSubmitting}
          initialData={editingPackage}
        />
      )}

      <SubscriberModal
        isOpen={showSubscribersModal}
        onClose={() => setShowSubscribersModal(false)}
        packageData={selectedPackage}
      />
    </div>
  );
}
