// app/api/doza-centers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog } from "@/app/lib/auditLogger";
import { getClientIp } from "@/app/lib/apiHelpers";
import {
  handleError,
  unauthorized,
  tooManyRequests,
  checkRole,
} from "@/app/lib/apiHelpers";

type Center = {
  centerId: string;
  centerName: string;
  centerType: string;
  status: string;
  verified: boolean;
  staffCount?: number;
  productCount?: number;
  totalInventoryValue?: number;
  [key: string]: any;
};

function calculateInventoryValue(products: any): number {
  if (!products) return 0;
  let total = 0;
  for (const key in products) {
    const p = products[key];
    total += (p.quantity || 0) * (p.costPerUnit || 0);
  }
  return total;
}

// ---------- GET ----------
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();

    const rateKey = `${userId}:centers`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `centers:${userRole}`;
    const cached = cache.get<Center[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const centersRef = ref(db, "doza_centers");
    const snapshot = await get(centersRef);
    let centers: Center[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const center = child.val() as Center;
        centers.push({
          ...center,
          centerId: child.key as string,
          staffCount: center.staff ? Object.keys(center.staff).length : 0,
          productCount: center.products
            ? Object.keys(center.products).length
            : 0,
          totalInventoryValue: calculateInventoryValue(center.products),
        });
      });
    }

    // Role‑based filtering
    if (userRole === "head_hospitals") {
      centers = centers.filter((c) => c.centerType === "hospital");
    } else if (userRole === "head_clinics") {
      centers = centers.filter((c) => c.centerType === "clinic");
    } else if (userRole === "head_pharmacies") {
      centers = centers.filter((c) => c.centerType === "pharmacy");
    }

    cache.set(cacheKey, centers, 30);
    return NextResponse.json({ success: true, data: centers });
  } catch (error) {
    return handleError(error);
  }
}

// app/api/doza-centers/route.ts (PUT section)
const verifyCenterSchema = z.object({
  verified: z.boolean().optional(),
  status: z.enum(["pending", "verified", "rejected"]).optional(),
  rejectionReason: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const rateKey = `${userId}:verify-center`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get("centerId");
    if (!centerId) {
      return NextResponse.json(
        { success: false, error: "centerId required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { verified, status, rejectionReason } =
      verifyCenterSchema.parse(body);

    const updates: Record<string, any> = {
      [`doza_centers/${centerId}/updatedAt`]: new Date().toISOString(),
    };
    if (verified !== undefined) {
      updates[`doza_centers/${centerId}/verified`] = verified;
    }
    if (status) {
      updates[`doza_centers/${centerId}/status`] = status;
      // If status is "verified" or "rejected", set verified accordingly
      if (status === "verified") {
        updates[`doza_centers/${centerId}/verified`] = true;
      } else if (status === "rejected") {
        updates[`doza_centers/${centerId}/verified`] = false;
      }
    }
    if (rejectionReason !== undefined) {
      updates[`doza_centers/${centerId}/rejectionReason`] = rejectionReason;
    }

    await update(ref(db), updates);
    cache.set(`centers:*`, null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: status || (verified ? "verify_center" : "unverify_center"),
      resource: "center",
      resourceId: centerId,
      details: `Center ${centerId} status updated to ${status || (verified ? "verified" : "unverified")}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      centerId: centerId,
    });

    return NextResponse.json({
      success: true,
      message: `Center updated`,
    });
  } catch (error) {
    return handleError(error);
  }
}
