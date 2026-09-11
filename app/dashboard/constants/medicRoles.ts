// app/config/medicRoles.ts

import {
  User,
  Users,
  Pill,
  Apple,
  Activity,
  Brain,
  Ambulance,
  Dumbbell,
  UserPlus,
  Stethoscope,
  Heart,
  Eye,
  Bone,
  Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

export interface MedicRole {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  specialties: string[];
}

export interface DocumentType {
  id: string;
  label: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number; // in MB
}

// ─── Medic Roles ──────────────────────────────────────────────────

export const medicRoles: MedicRole[] = [
  {
    id: "doctor",
    icon: Stethoscope,
    title: "Medical Doctor",
    description: "Licensed physician providing medical diagnosis and treatment",
    specialties: [
      "General Practice",
      "Cardiology",
      "Dermatology",
      "Pediatrics",
      "Internal Medicine",
      "Surgery",
      "Psychiatry",
      "Neurology",
      "Oncology",
      "Orthopedics",
      "Gynecology",
      "Urology",
    ],
  },
  {
    id: "nurse",
    icon: Users,
    title: "Nurse",
    description: "Registered nurse providing patient care and medical support",
    specialties: [
      "Registered Nurse",
      "Nurse Practitioner",
      "Critical Care",
      "Emergency",
      "Pediatric",
      "Geriatric",
      "Oncology",
      "Mental Health",
    ],
  },
  {
    id: "pharmacist",
    icon: Pill,
    title: "Pharmacist",
    description: "Medication expert providing pharmaceutical care",
    specialties: [
      "Clinical Pharmacy",
      "Community Pharmacy",
      "Hospital Pharmacy",
      "Industrial Pharmacy",
    ],
  },
  {
    id: "dentist",
    icon: Smile,
    title: "Dentist",
    description: "Oral health specialist providing dental care",
    specialties: [
      "General Dentistry",
      "Orthodontics",
      "Periodontics",
      "Oral Surgery",
      "Pediatric Dentistry",
    ],
  },
  {
    id: "dietician",
    icon: Apple,
    title: "Dietician",
    description: "Nutrition expert providing dietary guidance",
    specialties: [
      "Clinical Nutrition",
      "Sports Nutrition",
      "Pediatric Nutrition",
      "Renal Nutrition",
      "Diabetes Education",
    ],
  },
  {
    id: "physiotherapist",
    icon: Activity,
    title: "Physiotherapist",
    description: "Movement specialist providing physical rehabilitation",
    specialties: [
      "Sports Therapy",
      "Orthopedic",
      "Neurological",
      "Pediatric",
      "Geriatric",
    ],
  },
  {
    id: "psychologist",
    icon: Brain,
    title: "Psychologist",
    description: "Mental health professional providing therapy",
    specialties: [
      "Clinical Psychology",
      "Counseling",
      "Neuropsychology",
      "Child Psychology",
      "Health Psychology",
    ],
  },
  {
    id: "paramedic",
    icon: Ambulance,
    title: "Paramedic",
    description: "Emergency medical professional",
    specialties: ["Emergency Medicine", "Critical Care", "Flight Paramedic"],
  },
  {
    id: "fitness",
    icon: Dumbbell,
    title: "Fitness Professional",
    description: "Exercise and wellness specialist",
    specialties: [
      "Personal Training",
      "Yoga Instruction",
      "Pilates",
      "Strength Coaching",
      "Rehabilitation",
    ],
  },
  {
    id: "chiropractor",
    icon: Bone,
    title: "Chiropractor",
    description: "Spinal and musculoskeletal specialist",
    specialties: [
      "Spinal Adjustment",
      "Sports Chiropractic",
      "Rehabilitation",
      "Wellness Care",
    ],
  },
  {
    id: "optometrist",
    icon: Eye,
    title: "Optometrist",
    description: "Eye care and vision specialist",
    specialties: [
      "General Optometry",
      "Contact Lenses",
      "Low Vision",
      "Pediatric Optometry",
    ],
  },
  {
    id: "cardiologist",
    icon: Heart,
    title: "Cardiologist",
    description: "Heart and cardiovascular specialist",
    specialties: [
      "Interventional Cardiology",
      "Electrophysiology",
      "Heart Failure",
      "Preventive Cardiology",
    ],
  },
  {
    id: "other",
    icon: UserPlus,
    title: "Other Professional",
    description: "Other healthcare and wellness roles",
    specialties: [],
  },
];

// ─── Document Types ──────────────────────────────────────────────

export const documentTypes: DocumentType[] = [
  {
    id: "license",
    label: "Professional License",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSize: 5,
  },
  {
    id: "degree",
    label: "Degree Certificate",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSize: 5,
  },
  {
    id: "id",
    label: "Government ID",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSize: 5,
  },
  {
    id: "certifications",
    label: "Additional Certifications",
    required: false,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSize: 5,
  },
  {
    id: "malpractice",
    label: "Malpractice Insurance",
    required: false,
    acceptedFormats: [".pdf"],
    maxSize: 5,
  },
  {
    id: "cpr",
    label: "CPR/BLS Certification",
    required: false,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSize: 5,
  },
];

// ─── Helper Functions ─────────────────────────────────────────────

/**
 * Get a role by its ID
 */
export const getRoleById = (id: string): MedicRole | undefined => {
  return medicRoles.find((role) => role.id === id);
};

/**
 * Get a role by specialty name
 * Returns the 'other' role as fallback if no match found
 */
export const getRoleFromSpecialty = (specialty?: string): MedicRole => {
  if (!specialty) return medicRoles.find((r) => r.id === "other")!;
  for (const role of medicRoles) {
    if (role.specialties.includes(specialty)) {
      return role;
    }
  }
  return medicRoles.find((r) => r.id === "other")!;
};

/**
 * Get all unique specialties across all roles
 */
export const getAllSpecialties = (): string[] => {
  const set = new Set<string>();
  medicRoles.forEach((role) => {
    role.specialties.forEach((spec) => set.add(spec));
  });
  return Array.from(set).sort();
};

/**
 * Get role by title (case-insensitive)
 */
export const getRoleByTitle = (title: string): MedicRole | undefined => {
  return medicRoles.find(
    (role) => role.title.toLowerCase() === title.toLowerCase(),
  );
};

/**
 * Get all specialty suggestions for a given search term
 */
export const searchSpecialties = (query: string): string[] => {
  const lower = query.toLowerCase().trim();
  if (!lower) return getAllSpecialties();
  const all = getAllSpecialties();
  return all.filter((spec) => spec.toLowerCase().includes(lower));
};

/**
 * Get role ID from specialty (returns 'other' if not found)
 */
export const getRoleIdFromSpecialty = (specialty?: string): string => {
  return getRoleFromSpecialty(specialty).id;
};
