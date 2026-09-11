import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { rateLimiter } from "@/app/lib/rateLimit";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

// ─── Helper: parse a date from various formats ───────────────────

const parseDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // timestamp in milliseconds
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
    // try parsing as timestamp string
    const num = Number(value);
    if (!isNaN(num)) {
      const d2 = new Date(num);
      if (!isNaN(d2.getTime())) return d2;
    }
  }
  return null;
};

// ─── Aggregate daily counts from earliest date ───────────────────

function aggregateDaily(
  data: any[],
  dateFields: string[] = [
    "createdAt",
    "created_at",
    "registeredAt",
    "signupDate",
    "date",
  ],
): { date: string; count: number }[] {
  const dates: Date[] = [];
  data.forEach((item) => {
    for (const field of dateFields) {
      const val = item[field];
      if (val !== undefined && val !== null) {
        const dt = parseDate(val);
        if (dt) {
          dates.push(dt);
          break;
        }
      }
    }
  });

  if (dates.length === 0) return [];

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const now = new Date();
  const start = new Date(minDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const days =
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const daily: Record<string, number> = {};
  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const key = date.toISOString().split("T")[0];
    daily[key] = 0;
  }

  dates.forEach((dt) => {
    const key = dt.toISOString().split("T")[0];
    if (daily[key] !== undefined) daily[key]++;
  });

  return Object.entries(daily).map(([date, count]) => ({ date, count }));
}

// ─── GET ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:analytics`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    // Fetch all collections from actual Firebase paths
    const [centersSnap, medicsSnap, usersSnap, referralSnap] =
      await Promise.all([
        get(ref(db, "doza_centers")),
        get(ref(db, "doza_medics")),
        get(ref(db, "doza/users")),
        get(ref(db, "doza_admin/referralCodes")),
      ]);

    const centers = centersSnap.exists()
      ? Object.values(centersSnap.val())
      : [];
    const medics = medicsSnap.exists() ? Object.values(medicsSnap.val()) : [];
    const users = usersSnap.exists() ? Object.values(usersSnap.val()) : [];
    const referrals = referralSnap.exists()
      ? Object.values(referralSnap.val())
      : [];

    // ─── Key metrics ──────────────────────────────────────────

    const totalCenters = centers.length;
    const totalMedics = medics.length;
    const totalUsers = users.length;
    const totalReferrals = referrals.length;

    const verifiedCenters = centers.filter(
      (c: any) => c.verified === true || c.status === "verified",
    ).length;
    const verifiedMedics = medics.filter(
      (m: any) => m.verified === true || m.credentials?.verified === true,
    ).length;

    // ─── Daily trends (full history) ─────────────────────────

    const centerTrend = aggregateDaily(centers, [
      "createdAt",
      "created_at",
      "registrationDate",
    ]);
    const medicTrend = aggregateDaily(medics, ["createdAt", "created_at"]);
    const userTrend = aggregateDaily(users, [
      "createdAt",
      "created_at",
      "registeredAt",
      "signupDate",
    ]);

    // ─── Verification status breakdown ─────────────────────────

    const centerStatus = {
      pending: centers.filter(
        (c: any) => c.status === "pending" || c.verified === false,
      ).length,
      verified: verifiedCenters,
      rejected: centers.filter((c: any) => c.status === "rejected").length,
    };
    const medicStatus = {
      pending: medics.filter(
        (m: any) => m.status === "pending" || m.verified === false,
      ).length,
      verified: verifiedMedics,
      rejected: medics.filter((m: any) => m.status === "rejected").length,
    };

    // ─── Entity type distribution ─────────────────────────────

    const typeDistribution = {
      centers: totalCenters,
      medics: totalMedics,
      users: totalUsers,
    };

    // ─── Referral code usage ──────────────────────────────────

    const totalReferralUsage = referrals.reduce(
      (sum: number, r: any) => sum + (r.usageCount || 0),
      0,
    );
    const activeReferralCodes = referrals.filter((r: any) => {
      const expired = r.expiresAt ? new Date(r.expiresAt) < new Date() : false;
      const limitReached = r.usageLimit && r.usageCount >= r.usageLimit;
      return !expired && !limitReached;
    }).length;

    // ─── Recent activity (last 10) ─────────────────────────────

    const allEntities = [
      ...centers.map((c: any) => {
        let name = c.centerName || c.name || "Unnamed Center";
        if (c.ownerInfo?.fullName) name += ` (${c.ownerInfo.fullName})`;
        return {
          type: "center",
          name,
          createdAt: c.createdAt || c.created_at,
        };
      }),
      ...medics.map((m: any) => {
        const firstName = m.personalInfo?.firstName || "";
        const lastName = m.personalInfo?.lastName || "";
        const fullName =
          `${firstName} ${lastName}`.trim() || m.name || "Unnamed Medic";
        return {
          type: "medic",
          name: fullName,
          createdAt: m.createdAt || m.created_at,
        };
      }),
      ...users.map((u: any) => {
        let name = "Unnamed User";
        if (u.personalProfile?.fname || u.personalProfile?.lname) {
          name =
            `${u.personalProfile.fname || ""} ${u.personalProfile.lname || ""}`.trim();
        } else if (u.fullName) {
          name = u.fullName;
        } else if (u.name) {
          name = u.name;
        } else if (u.email) {
          name = u.email;
        }
        return {
          type: "user",
          name,
          createdAt: u.createdAt || u.created_at || u.registeredAt,
        };
      }),
    ]
      .filter((e) => e.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    // ─── Response ─────────────────────────────────────────────

    const response = {
      metrics: {
        totalCenters,
        totalMedics,
        totalUsers,
        totalReferrals,
        verifiedCenters,
        verifiedMedics,
        totalReferralUsage,
        activeReferralCodes,
      },
      trends: {
        centers: centerTrend,
        medics: medicTrend,
        users: userTrend,
      },
      status: {
        centers: centerStatus,
        medics: medicStatus,
      },
      distribution: typeDistribution,
      recentActivity: allEntities,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    return handleError(error);
  }
}
