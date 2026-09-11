// app/api/admin/audit-logs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  handleError,
  unauthorized,
  tooManyRequests,
} from "@/app/lib/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:admin-audit-logs`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const resource = searchParams.get("resource") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const cacheKey = `adminAuditLogs:${page}:${limit}:${search}:${action}:${resource}:${status}:${dateFrom}:${dateTo}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const logsRef = ref(db, "doza_admin/auditLogs");
    const snapshot = await get(logsRef);
    let logs: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const log = child.val();
        logs.push({ id: child.key, ...log });
      });
    }

    // Apply filters (same as before)
    let filtered = logs;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userName?.toLowerCase().includes(s) ||
          log.action?.toLowerCase().includes(s) ||
          log.resource?.toLowerCase().includes(s) ||
          log.details?.toLowerCase().includes(s),
      );
    }
    if (action && action !== "all") {
      filtered = filtered.filter((log) => log.action === action);
    }
    if (resource && resource !== "all") {
      filtered = filtered.filter((log) => log.resource === resource);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((log) => log.status === status);
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      filtered = filtered.filter(
        (log) => new Date(log.timestamp).getTime() >= from,
      );
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime();
      filtered = filtered.filter(
        (log) => new Date(log.timestamp).getTime() <= to,
      );
    }

    // Sort newest first
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const result = {
      logs: paginated,
      total,
      page,
      limit,
    };

    cache.set(cacheKey, result, 30);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
