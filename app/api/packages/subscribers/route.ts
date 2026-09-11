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
    const packageId = searchParams.get("packageId");
    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "packageId required" },
        { status: 400 },
      );
    }

    const rateKey = `${userId}:subscribers`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const subsRef = ref(db, "doza_admin/subscriptions");
    const q = query(subsRef, orderByChild("packageId"), equalTo(packageId));
    const snap = await get(q);
    const subscriptions = snap.exists() ? Object.values(snap.val()) : [];
    return NextResponse.json({ success: true, data: subscriptions });
  } catch (error) {
    return handleError(error);
  }
}
