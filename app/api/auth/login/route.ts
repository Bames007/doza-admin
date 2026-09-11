// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { loginSchema } from "@/app/lib/validation";
import { z } from "zod";
import { getClientIp } from "@/app/lib/apiHelpers";

async function writeAuditLog(params: {
  centerId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  status: "success" | "failure";
  ipAddress: string;
  userAgent: string;
}) {
  try {
    const {
      centerId,
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
    } = params;

    const auditEntry = {
      userId,
      userName,
      userRole,
      centerId,
      action,
      resource,
      resourceId: resourceId || "",
      details,
      status,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
    };

    const auditRef = ref(db, `doza_centers/${centerId}/auditLogs`);
    const newRef = push(auditRef);
    await set(newRef, auditEntry);
    logger.debug({ centerId, userId, action, status }, "Audit log written");
  } catch (error) {
    logger.error({ error }, "Failed to write audit log during login");
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // 1. Rate limiting (5 attempts per minute per IP)
    const rateKey = `login:${ip}`;
    if (!rateLimiter.check(rateKey, 5, 60)) {
      logger.warn({ ip }, "Rate limit exceeded for login");
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
        },
        { status: 429 },
      );
    }

    // 2. Parse and validate request body with Zod
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const { fullName, centerName, otp } = validated;
    logger.info({ fullName, centerName, ip }, "Login attempt");

    // 3. Normalize inputs
    const sanitizedFullName = fullName.trim().toLowerCase();
    const sanitizedCenterName = centerName.trim().toLowerCase();
    const sanitizedOtp = otp.trim();

    // 4. Fetch centers from Firebase
    const centersRef = ref(db, "doza_centers");
    const centersSnapshot = await get(centersRef);

    if (!centersSnapshot.exists()) {
      logger.warn("No centers found in database");
      return NextResponse.json(
        {
          success: false,
          error: "Center not found. Please check the center name.",
        },
        { status: 404 },
      );
    }

    const centersData = centersSnapshot.val();

    // 5. Find center by name
    let foundCenter: any = null;
    let centerKey: string = "";

    for (const [key, center] of Object.entries(centersData)) {
      const centerData = center as any;
      const dbCenterName =
        centerData.centerName?.toLowerCase?.()?.trim?.() || "";
      if (dbCenterName === sanitizedCenterName) {
        foundCenter = centerData;
        centerKey = key;
        logger.info(
          { centerKey, centerName: centerData.centerName },
          "Center found",
        );
        break;
      }
    }

    if (!foundCenter) {
      logger.warn({ centerName: sanitizedCenterName }, "Center not found");
      return NextResponse.json(
        {
          success: false,
          error:
            "Healthcare center not found. Please check the center name and try again.",
        },
        { status: 404 },
      );
    }

    // 6. Find staff member by full name
    const staff = foundCenter.staff;
    if (!staff || Object.keys(staff).length === 0) {
      logger.warn({ centerKey }, "No staff found for center");
      return NextResponse.json(
        {
          success: false,
          error: "No staff members registered for this center.",
        },
        { status: 404 },
      );
    }

    let foundStaff: any = null;
    let staffKey: string = "";

    for (const [id, staffMember] of Object.entries(staff)) {
      const staffData = staffMember as any;
      const staffName = (staffData.personalInfo?.fullName || "")
        .toLowerCase()
        .trim();

      if (
        staffName === sanitizedFullName ||
        sanitizedFullName.includes(staffName) ||
        staffName.includes(sanitizedFullName)
      ) {
        foundStaff = staffData;
        staffKey = id;
        logger.info(
          { staffKey, fullName: staffData.personalInfo?.fullName },
          "Staff found",
        );
        break;
      }
    }

    if (!foundStaff) {
      logger.warn({ fullName: sanitizedFullName }, "Staff member not found");
      await writeAuditLog({
        centerId: centerKey,
        userId: "unknown",
        userName: fullName.trim(),
        userRole: "unknown",
        action: "login",
        resource: "user",
        details: `Login failed: staff member not found (${fullName.trim()})`,
        status: "failure",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Staff member not found. Please check your full name and try again.",
        },
        { status: 404 },
      );
    }

    // 7. Validate OTP
    const storedOtp = foundCenter.verificationOtp ?? foundCenter.otp;
    if (!storedOtp) {
      logger.warn({ centerKey }, "No OTP configured for center");
      await writeAuditLog({
        centerId: centerKey,
        userId: staffKey,
        userName: foundStaff.personalInfo?.fullName || "Unknown",
        userRole: foundStaff.isOwner
          ? "center_owner"
          : foundStaff.professional?.role || "staff",
        action: "login",
        resource: "user",
        resourceId: staffKey,
        details: "Login failed: no OTP configured for center",
        status: "failure",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Verification code not configured for this center. Please contact support.",
        },
        { status: 401 },
      );
    }

    if (storedOtp.toString() !== sanitizedOtp.toString()) {
      logger.warn({ centerKey, staffKey }, "OTP mismatch");
      await writeAuditLog({
        centerId: centerKey,
        userId: staffKey,
        userName: foundStaff.personalInfo?.fullName || "Unknown",
        userRole: foundStaff.isOwner
          ? "center_owner"
          : foundStaff.professional?.role || "staff",
        action: "login",
        resource: "user",
        resourceId: staffKey,
        details: "Login failed: invalid OTP",
        status: "failure",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid verification code. Please use the code provided during center registration.",
        },
        { status: 401 },
      );
    }

    logger.info({ centerKey, staffKey }, "OTP validated successfully");

    // 8. Build session payload
    const userSession = {
      user: {
        id: staffKey,
        staffId: foundStaff.staffId || staffKey,
        fullName: foundStaff.personalInfo?.fullName || "",
        email: foundStaff.personalInfo?.email || "",
        role: foundStaff.isOwner
          ? "center_owner"
          : foundStaff.professional?.role || "staff",
        isOwner: foundStaff.isOwner || false,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      },
      center: {
        id: centerKey,
        centerId: foundCenter.centerId || centerKey,
        name: foundCenter.centerName,
        type: foundCenter.centerType,
      },
      loginTime: new Date().toISOString(),
    };

    // 9. Log successful login
    await writeAuditLog({
      centerId: centerKey,
      userId: staffKey,
      userName: foundStaff.personalInfo?.fullName || "Unknown",
      userRole: foundStaff.isOwner
        ? "center_owner"
        : foundStaff.professional?.role || "staff",
      action: "login",
      resource: "user",
      resourceId: staffKey,
      details: `Successful login from ${ip}`,
      status: "success",
      ipAddress: ip,
      userAgent,
    });

    logger.info({ userId: staffKey, centerId: centerKey }, "Login successful");
    return NextResponse.json({
      success: true,
      data: userSession,
    });
  } catch (error) {
    // Use centralized error handler
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    logger.error({ error }, "Login error");
    return NextResponse.json(
      {
        success: false,
        error: "Authentication server error. Please try again later.",
      },
      { status: 500 },
    );
  }
}
