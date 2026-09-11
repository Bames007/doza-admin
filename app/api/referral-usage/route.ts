import { NextRequest, NextResponse } from "next/server";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { rateLimiter } from "@/app/lib/rateLimit";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get("codeId");
    if (!codeId) {
      return NextResponse.json(
        { success: false, error: "codeId is required" },
        { status: 400 },
      );
    }

    const rateKey = `${userId}:referral-usage`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const usageRef = ref(db, "doza_admin/referralUsageLogs");
    const usageQuery = query(usageRef, orderByChild("codeId"), equalTo(codeId));
    const snapshot = await get(usageQuery);
    let logs: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        logs.push({ id: child.key, ...child.val() });
      });
      logs.sort((a, b) => (a.usedAt < b.usedAt ? 1 : -1));
    }

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return handleError(error);
  }
}
