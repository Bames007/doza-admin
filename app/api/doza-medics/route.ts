// app/api/doza-medics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { getClientIp } from "@/app/lib/apiHelpers";
import { writeAuditLog } from "@/app/lib/auditLogger";
import {
  handleError,
  unauthorized,
  tooManyRequests,
  checkRole,
} from "@/app/lib/apiHelpers";

type Medic = {
  id?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  credentials: {
    verified: boolean;
    documents?: any[];
  };
  status: string;
  [key: string]: any;
};

// ---------- GET ----------
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:medics`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = "medics";
    const cached = cache.get<Medic[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const medicsRef = ref(db, "doza_medics");
    const snapshot = await get(medicsRef);
    let medics: Medic[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const medic = child.val() as Medic;
        medics.push({ ...medic, id: child.key as string });
      });
    }

    cache.set(cacheKey, medics, 30);
    return NextResponse.json({ success: true, data: medics });
  } catch (error) {
    return handleError(error);
  }
}

const verifyMedicSchema = z.object({
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

    const rateKey = `${userId}:verify-medic`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const medicId = searchParams.get("medicId");
    if (!medicId) {
      return NextResponse.json(
        { success: false, error: "medicId required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { verified, status, rejectionReason } = verifyMedicSchema.parse(body);

    const updates: Record<string, any> = {
      [`doza_medics/${medicId}/lastUpdated`]: new Date().toISOString(),
    };
    if (verified !== undefined) {
      updates[`doza_medics/${medicId}/credentials/verified`] = verified;
    }
    if (status) {
      updates[`doza_medics/${medicId}/status`] = status;
      updates[`doza_medics/${medicId}/credentials/status`] = status;
      if (status === "verified") {
        updates[`doza_medics/${medicId}/credentials/verified`] = true;
      } else if (status === "rejected") {
        updates[`doza_medics/${medicId}/credentials/verified`] = false;
      }
    }
    if (rejectionReason !== undefined) {
      updates[`doza_medics/${medicId}/credentials/rejectionReason`] =
        rejectionReason;
    }

    await update(ref(db), updates);
    cache.set("medics", null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: status || (verified ? "verify_medic" : "unverify_medic"),
      resource: "medic",
      resourceId: medicId,
      details: `Medic ${medicId} status updated to ${status || (verified ? "verified" : "unverified")}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: `Medic updated`,
    });
  } catch (error) {
    return handleError(error);
  }
}
