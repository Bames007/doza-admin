// app/lib/auditLogger.ts

import { ref, push, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";

interface AuditLogData {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  status: "success" | "failure";
  ipAddress?: string;
  userAgent?: string;
  centerId?: string;
}

export async function writeAuditLog(data: AuditLogData) {
  const {
    userId,
    userName,
    userRole,
    action,
    resource,
    resourceId,
    details,
    status,
    ipAddress,
    userAgent,
    centerId,
  } = data;

  const logEntry = {
    userId,
    userName,
    userRole,
    action,
    resource,
    resourceId: resourceId || null,
    details,
    status,
    ipAddress: ipAddress || "unknown",
    userAgent: userAgent || "unknown",
    centerId: centerId || null,
    timestamp: new Date().toISOString(),
  };

  try {
    const logsRef = ref(db, "doza_admin/auditLogs");
    const newRef = push(logsRef);
    await update(ref(db), {
      [`doza_admin/auditLogs/${newRef.key}`]: logEntry,
    });
    return newRef.key;
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Don't throw – audit logging should never break the main flow
    return null;
  }
}
