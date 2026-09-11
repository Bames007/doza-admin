import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

export interface AnalyticsData {
  metrics: {
    totalCenters: number;
    totalMedics: number;
    totalUsers: number;
    totalReferrals: number;
    verifiedCenters: number;
    verifiedMedics: number;
    totalReferralUsage: number;
    activeReferralCodes: number;
  };
  trends: {
    centers: { date: string; count: number }[];
    medics: { date: string; count: number }[];
    users: { date: string; count: number }[];
  };
  status: {
    centers: { pending: number; verified: number; rejected: number };
    medics: { pending: number; verified: number; rejected: number };
  };
  distribution: {
    centers: number;
    medics: number;
    users: number;
  };
  recentActivity: { type: string; name: string; createdAt: string }[];
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const response = await apiFetch("/api/analytics");
      setData(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return { data, loading, error, refetch: fetchAnalytics };
}
