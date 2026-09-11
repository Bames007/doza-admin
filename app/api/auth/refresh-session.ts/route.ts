// app/api/auth/refresh-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { getClientIp } from "@/app/lib/apiHelpers";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateKey = `refresh-session:${ip}`;
  if (!rateLimiter.check(rateKey, 10, 60)) {
    logger.warn({ ip }, "Rate limit exceeded for session refresh");
    return tooManyRequests();
  }

  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get("userSession")?.value;

    if (!userSession) {
      logger.warn("Session refresh attempted without active session");
      return unauthorized();
    }

    try {
      const sessionData = JSON.parse(userSession);
      logger.info({ userId: sessionData?.user?.id }, "Refreshing session");

      // Add 30 minutes to expiry
      const newExpiry = Date.now() + 30 * 60 * 1000;

      const updatedSession = {
        ...sessionData,
        expiresAt: newExpiry,
      };

      const response = NextResponse.json({
        success: true,
        message: "Session refreshed",
      });

      response.cookies.set({
        name: "userSession",
        value: JSON.stringify(updatedSession),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 60, // 30 minutes
        path: "/",
      });

      logger.info("Session refreshed successfully");
      return response;
    } catch (parseError: any) {
      logger.warn({ error: parseError.message }, "Invalid session data");
      return unauthorized();
    }
  } catch (error) {
    logger.error({ error }, "Failed to refresh session");
    return NextResponse.json(
      { success: false, error: "Failed to refresh session" },
      { status: 500 },
    );
  }
}
