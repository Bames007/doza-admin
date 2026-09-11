import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update, remove } from "firebase/database";
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

const packageSchema = z.object({
  name: z.string().min(1),
  entityType: z.enum(["center", "medic", "user"]),
  category: z.string().min(1),
  price: z.coerce.number().min(0),
  icon: z.string().optional(),
  benefits: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:packages`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = "packages";
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const snap = await get(ref(db, "doza_admin/packages"));
    const packages = snap.exists() ? Object.values(snap.val()) : [];
    cache.set(cacheKey, packages, 30);
    return NextResponse.json({ success: true, data: packages });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const rateKey = `${userId}:create-package`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const data = packageSchema.parse(body);

    const newRef = push(ref(db, "doza_admin/packages"));
    const packageData = {
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      id: newRef.key,
    };
    await update(newRef, packageData);

    cache.set("packages", null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "create_package",
      resource: "package",
      resourceId: newRef.key,
      details: `Created ${data.entityType} package: ${data.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, data: packageData });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 },
      );
    }

    const validated = packageSchema.partial().parse(updates);
    const packageRef = ref(db, `doza_admin/packages/${id}`);
    await update(packageRef, validated);

    cache.set("packages", null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "update_package",
      resource: "package",
      resourceId: id,
      details: `Updated package ${id}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, message: "Package updated" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id required" },
        { status: 400 },
      );
    }

    await remove(ref(db, `doza_admin/packages/${id}`));
    cache.set("packages", null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "delete_package",
      resource: "package",
      resourceId: id,
      details: `Deleted package ${id}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, message: "Package deleted" });
  } catch (error) {
    return handleError(error);
  }
}
