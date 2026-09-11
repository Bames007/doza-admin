// app/api/doza-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:users`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = "doza_users";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const usersRef = ref(db, "doza/users");
    const snapshot = await get(usersRef);
    let users: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const user = child.val();
        users.push({
          id: child.key,
          ...user,
          // ensure we have a createdAt date if missing
          createdAt: user.createdAt || user.registeredAt || null,
        });
      });
    }

    cache.set(cacheKey, users, 30); // cache for 30 seconds
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return handleError(error);
  }
}
