// lib/validation.ts

import { z } from "zod";

export const facilitySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  type: z.string().min(1, "Type is required").trim(),
  capacity: z.coerce.number().int().positive().default(1),
  available: z.coerce.number().int().nonnegative().default(1),
  costPerDay: z.coerce.number().nonnegative().default(0),
  description: z.string().optional().default(""),
  features: z.array(z.string().trim()).optional().default([]),
});

// ✅ Added: Service Schema
export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  category: z.string().min(1, "Category is required").trim(),
  price: z.coerce.number().nonnegative().default(0),
  duration: z.coerce.number().int().positive().optional(),
  description: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

// ✅ Added: Test Schema (for test catalog)
export const testSchema = z.object({
  name: z.string().min(1, "Test name is required").trim(),
  category: z.string().min(1, "Category is required").trim(),
  price: z.coerce.number().nonnegative().default(0),
  duration: z.coerce.number().int().positive().optional(),
  description: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  sampleType: z.string().optional().default(""),
  preparationInstructions: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const loginSchema = z.object({
  fullName: z.string().min(1, "Full name is required").trim(),
  centerName: z.string().min(1, "Center name is required").trim(),
  otp: z.string().min(1, "Verification code is required").trim(),
});

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID required"),
  patientName: z.string().min(1, "Patient name required"),
  patientPhone: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  doctorName: z.string().optional().nullable(),
  title: z.string().optional(),
  type: z.string().optional(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
  reminders: z
    .object({ email: z.boolean().optional(), sms: z.boolean().optional() })
    .optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name required").trim(),
  sku: z.string().min(1, "SKU required").trim().toUpperCase(),
  category: z.string().min(1, "Category required").trim().toLowerCase(),
  quantity: z.coerce.number().int().nonnegative().default(0),
  unitPrice: z.coerce.number().nonnegative().default(0),
  sellingPrice: z.coerce.number().nonnegative().optional(),
  barcode: z.string().optional(),
  barcodeType: z.string().optional(),
  description: z.string().optional().default(""),
  supplier: z.string().optional().default(""),
  lotNumber: z.string().optional().default(""),
  expiryDate: z.string().optional().nullable(),
  isMedicalEquipment: z.boolean().optional().default(false),
  minStockLevel: z.coerce.number().int().nonnegative().default(5),
  maxStockLevel: z.coerce.number().int().nonnegative().default(100),
  location: z.string().optional().default("Main Storage"),
  markupPercentage: z.coerce.number().nonnegative().optional().default(20),
  prescriptionRequired: z.boolean().optional().default(false),
});

export const inventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  newQuantity: z.coerce.number().int().nonnegative(),
  reason: z.string().min(1, "Reason required"),
  notes: z.string().optional().default(""),
});

export const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  lastMaintenance: z.string().optional().nullable(),
  nextMaintenance: z.string().optional().nullable(),
  status: z
    .enum(["operational", "maintenance", "needs service", "retired"])
    .optional()
    .default("operational"),
  notes: z.string().optional().nullable(),
});
