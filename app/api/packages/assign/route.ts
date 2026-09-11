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

const assignSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(["center", "medic", "user"]),
  packageId: z.string(),
  assign: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "ceo";
    if (!userId) return unauthorized();
    if (!checkRole(userRole, ["ceo", "admin"])) return unauthorized();

    const body = await request.json();
    const { entityId, entityType, packageId, assign } =
      assignSchema.parse(body);

    const rateKey = `${userId}:assign-package`;
    if (!rateLimiter.check(rateKey, 50, 60)) return tooManyRequests();

    const subsRef = ref(db, "doza_admin/subscriptions");
    if (!assign) {
      const q = query(subsRef, orderByChild("entityId"), equalTo(entityId));
      const snap = await get(q);
      if (snap.exists()) {
        snap.forEach((child) => {
          const sub = child.val();
          if (sub.packageId === packageId) {
            remove(child.ref);
          }
        });
      }
      cache.set("subscriptions", null, 0);
      return NextResponse.json({ success: true, message: "Unassigned" });
    }

    const q = query(subsRef, orderByChild("entityId"), equalTo(entityId));
    const snap = await get(q);
    let existingKey = null;
    if (snap.exists()) {
      snap.forEach((child) => {
        const sub = child.val();
        if (sub.packageId === packageId) {
          existingKey = child.key;
        }
      });
    }
    const data = {
      entityId,
      entityType,
      packageId,
      assignedAt: new Date().toISOString(),
      assignedBy: userId,
      status: "active",
    };
    if (existingKey) {
      await update(ref(db, `doza_admin/subscriptions/${existingKey}`), data);
    } else {
      await push(subsRef, data);
    }

    cache.set("subscriptions", null, 0);

    await writeAuditLog({
      userId,
      userName,
      userRole,
      action: "assign_package",
      resource: "subscription",
      details: `${entityType} ${entityId} assigned to package ${packageId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, message: "Assigned" });
  } catch (error) {
    return handleError(error);
  }
}
