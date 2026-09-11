// app/api/admin/audit-logs/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { unauthorized } from "@/app/lib/apiHelpers";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return unauthorized();

  const logsRef = ref(db, "doza_admin/auditLogs");
  const snapshot = await get(logsRef);
  let logs: any[] = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const log = child.val();
      logs.push({ id: child.key, ...log });
    });
  }

  // Sort descending
  logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Build CSV
  const headers = [
    "Timestamp",
    "User",
    "Role",
    "Action",
    "Resource",
    "ResourceId",
    "Details",
    "IP",
    "Status",
  ];
  const rows = logs.map((log) => [
    log.timestamp,
    log.userName,
    log.userRole,
    log.action,
    log.resource,
    log.resourceId || "",
    log.details,
    log.ipAddress,
    log.status,
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv +=
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",") +
      "\n";
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
