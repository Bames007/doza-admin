// hooks/useReferralCodes.ts
import { useEffect, useState, useMemo } from "react";
import { apiFetch, apiPost, apiDelete, apiPatch } from "@/app/lib/api";

export function useReferralCodes(filters?: {
  assignedToType?: string;
  assignedToId?: string;
}) {
  const [codes, setCodes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalUsage: 0,
    avgReward: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = () => {
    let url = "/api/referral-codes";
    const params = new URLSearchParams();
    if (filters?.assignedToType)
      params.append("assignedToType", filters.assignedToType);
    if (filters?.assignedToId)
      params.append("assignedToId", filters.assignedToId);
    if (params.toString()) url += `?${params.toString()}`;
    return url;
  };

  const fetchCodes = async () => {
    try {
      // ✅ Force a fresh fetch by adding a cache‑busting parameter
      const url = buildUrl();
      const response = await apiFetch(url, { cacheKey: url + Date.now() });
      // Now `response` is `{ codes, stats }` (because apiFetch unwrapped `data`)
      setCodes(response?.codes || []);
      setStats(
        response?.stats || {
          total: 0,
          active: 0,
          expired: 0,
          totalUsage: 0,
          avgReward: 0,
        },
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCode = async (payload: any) => {
    const result = await apiPost("/api/referral-codes", payload);
    await fetchCodes();
    return result;
  };

  const deleteCode = async (id: string) => {
    await apiDelete(`/api/referral-codes?id=${id}`);
    await fetchCodes();
  };

  const useCode = async (
    code: string,
    usedBy: string,
    usedByType: "center" | "medic" | "user",
    usedFor?: string,
    metadata?: any,
  ) => {
    const result = await apiPatch("/api/referral-codes", {
      code,
      usedBy,
      usedByType,
      usedFor,
      metadata,
    });
    await fetchCodes();
    return result;
  };

  const stableFilters = useMemo(
    () => filters,
    [filters?.assignedToType, filters?.assignedToId],
  );

  useEffect(() => {
    fetchCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFilters?.assignedToType, stableFilters?.assignedToId]);

  return {
    codes,
    stats,
    loading,
    error,
    refetch: fetchCodes,
    createCode,
    deleteCode,
    useCode,
  };
}
