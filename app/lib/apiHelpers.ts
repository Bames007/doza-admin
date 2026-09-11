// app/lib/apiHelpers.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/app/utils/logger";

export function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  );
}

export function tooManyRequests() {
  return NextResponse.json(
    { success: false, error: "Too many requests" },
    { status: 429 },
  );
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: error.issues,
      },
      { status: 400 },
    );
  }
  const msg = error instanceof Error ? error.message : String(error);
  logger.error({ error: msg }, "API error");
  return NextResponse.json({ success: false, error: msg }, { status: 500 });
}

export function checkRole(
  userRole: string | null,
  allowedRoles: string[],
): boolean {
  return userRole ? allowedRoles.includes(userRole) : false;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}
