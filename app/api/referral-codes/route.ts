// app/api/referral-codes/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ref,
  get,
  push,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { z } from "zod";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { getClientIp } from "@/app/lib/apiHelpers";
import { writeAuditLog } from "@/app/lib/auditLogger";
import {
  handleError,
  unauthorized,
  tooManyRequests,
  checkRole,
} from "@/app/lib/apiHelpers";

// ─── Schemas ──────────────────────────────────────────────────────

const referralSchema = z.object({
  code: z.string().min(3).max(20),
  assignedToType: z.enum(["center", "medic", "user"]),
  assignedToId: z.string(),
  assignedToName: z.string().optional(),
  rewardType: z.enum(["discount", "points", "cashback"]),
  rewardValue: z.coerce.number().positive(),
  expiresAt: z.string().optional(),
  usageLimit: z.coerce.number().positive().optional(),
  description: z.string().optional(),
});

const useSchema = z.object({
  code: z.string(),
  usedBy: z.string(),
  usedByType: z.enum(["center", "medic", "user"]),
  usedFor: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ─── GET ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const assignedToType = searchParams.get("assignedToType");
    const assignedToId = searchParams.get("assignedToId");

    const rateKey = `${userId}:referral-codes`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `referralCodes:${assignedToType || ""}:${assignedToId || ""}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const refCodes = ref(db, "doza_admin/referralCodes");
    const snapshot = await get(refCodes);
    let codes: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const val = child.val();
        codes.push({
          id: child.key,
          ...val,
          usageCount: val.usageCount || 0,
          isActive: !val.expiresAt || new Date(val.expiresAt) > new Date(),
        });
      });
    }

    if (assignedToType && assignedToId) {
      codes = codes.filter(
        (c) =>
          c.assignedToType === assignedToType &&
          c.assignedToId === assignedToId,
      );
    } else if (assignedToType) {
      codes = codes.filter((c) => c.assignedToType === assignedToType);
    } else if (assignedToId) {
      codes = codes.filter((c) => c.assignedToId === assignedToId);
    }

    const total = codes.length;
    const active = codes.filter((c) => c.isActive).length;
    const expired = total - active;
    const totalUsage = codes.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    const avgReward = total
      ? Math.round(
          codes.reduce((sum, c) => sum + (c.rewardValue || 0), 0) / total,
        )
      : 0;

    const stats = { total, active, expired, totalUsage, avgReward };
    const result = { codes, stats };

    cache.set(cacheKey, result, 30);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const rateKey = `${userId}:create-referral`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = referralSchema.parse(body);
    const {
      code,
      assignedToType,
      assignedToId,
      assignedToName,
      rewardType,
      rewardValue,
      expiresAt,
      usageLimit,
      description,
    } = validated;

    const refCodes = ref(db, "doza_admin/referralCodes");
    const snapshot = await get(refCodes);
    if (snapshot.exists()) {
      let duplicate = false;
      snapshot.forEach((child) => {
        if (child.val().code === code) duplicate = true;
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Referral code already exists" },
          { status: 409 },
        );
      }
    }

    const newRef = push(refCodes);
    const data = {
      code,
      assignedToType,
      assignedToId,
      assignedToName: assignedToName || "",
      rewardType,
      rewardValue,
      expiresAt: expiresAt || null,
      usageLimit: usageLimit || null,
      usageCount: 0,
      description: description || "",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
    await update(ref(db), {
      [`doza_admin/referralCodes/${newRef.key}`]: data,
    });

    cache.set(`referralCodes:*`, null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "create_referral_code",
      resource: "referral_code",
      resourceId: newRef.key,
      details: `Created ${rewardType} code ${code} for ${assignedToType} ${assignedToId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...data },
      message: "Referral code created",
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const rateKey = `${userId}:delete-referral`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id required" },
        { status: 400 },
      );
    }

    const codeRef = ref(db, `doza_admin/referralCodes/${id}`);
    const snapshot = await get(codeRef);
    const codeData = snapshot.val();

    await remove(codeRef);
    cache.set(`referralCodes:*`, null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "delete_referral_code",
      resource: "referral_code",
      resourceId: id,
      details: `Deleted referral code: ${codeData?.code || id}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Referral code deleted",
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PATCH ────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();

    const body = await request.json();
    const { code, usedBy, usedByType, usedFor, metadata } =
      useSchema.parse(body);

    const refCodes = ref(db, "doza_admin/referralCodes");
    const snapshot = await get(refCodes);
    let foundKey: string | null = null;
    let foundData: any = null;
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        if (child.val().code === code) {
          foundKey = child.key;
          foundData = child.val();
        }
      });
    }
    if (!foundKey || !foundData) {
      return NextResponse.json(
        { success: false, error: "Referral code not found" },
        { status: 404 },
      );
    }

    if (foundData.expiresAt && new Date(foundData.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Referral code has expired" },
        { status: 400 },
      );
    }

    const currentUsage = foundData.usageCount || 0;
    if (foundData.usageLimit && currentUsage >= foundData.usageLimit) {
      return NextResponse.json(
        { success: false, error: "Referral code usage limit reached" },
        { status: 400 },
      );
    }

    const updatedUsage = currentUsage + 1;
    await update(ref(db), {
      [`doza_admin/referralCodes/${foundKey}/usageCount`]: updatedUsage,
    });

    const usageLogRef = ref(db, "doza_admin/referralUsageLogs");
    const usageLog = {
      codeId: foundKey,
      code,
      usedBy,
      usedByType,
      usedFor: usedFor || "",
      usedAt: new Date().toISOString(),
      rewardType: foundData.rewardType,
      rewardValue: foundData.rewardValue,
      metadata: metadata || {},
    };
    await push(usageLogRef, usageLog);

    cache.set(`referralCodes:*`, null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "use_referral_code",
      resource: "referral_code",
      resourceId: foundKey,
      details: `Used code ${code} for ${usedByType} ${usedBy}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: {
        rewardType: foundData.rewardType,
        rewardValue: foundData.rewardValue,
        usageCount: updatedUsage,
        assignedToType: foundData.assignedToType,
        assignedToId: foundData.assignedToId,
        assignedToName: foundData.assignedToName,
      },
      message: "Referral code applied successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT (update) ──────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const rateKey = `${userId}:update-referral`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 },
      );
    }

    // Allow partial updates
    const schema = referralSchema.partial();
    const validated = schema.parse(updates);

    const codeRef = ref(db, `doza_admin/referralCodes/${id}`);
    const snapshot = await get(codeRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Referral code not found" },
        { status: 404 },
      );
    }

    await update(codeRef, validated);

    cache.set(`referralCodes:*`, null, 0); // clear all caches

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "update_referral_code",
      resource: "referral_code",
      resourceId: id,
      details: `Updated referral code: ${id}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Referral code updated",
    });
  } catch (error) {
    return handleError(error);
  }
}
