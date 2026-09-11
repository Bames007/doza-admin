// app/api/auth/set-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { getClientIp } from "@/app/lib/apiHelpers";
import { tooManyRequests } from "@/app/lib/apiHelpers";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateKey = `set-session:${ip}`;
  if (!rateLimiter.check(rateKey, 10, 60)) {
    logger.warn({ ip }, "Rate limit exceeded for set-session");
    return tooManyRequests();
  }

  try {
    const sessionData = await request.json();
    logger.info(
      { userId: sessionData?.user?.id, centerId: sessionData?.center?.id, ip },
      "Creating session",
    );

    // Validate required fields
    if (!sessionData?.user?.id || !sessionData?.center?.id) {
      logger.warn("Missing required session data");
      return NextResponse.json(
        { success: false, error: "Invalid session data" },
        { status: 400 },
      );
    }

    const sessionWithExpiry = {
      ...sessionData,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    const response = NextResponse.json({
      success: true,
      message: "Session created",
    });

    response.cookies.set({
      name: "userSession",
      value: JSON.stringify(sessionWithExpiry),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set({
      name: "authToken",
      value: `doza-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    logger.info("Session cookies set successfully");
    return response;
  } catch (error) {
    logger.error({ error }, "Failed to set session");
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 },
    );
  }
}
