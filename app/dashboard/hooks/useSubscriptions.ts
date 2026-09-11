import { useEffect, useState } from "react";
import { apiFetch, apiPost } from "@/app/lib/api";

export interface Subscription {
  id?: string;
  entityId: string;
  entityType: "center" | "medic" | "user";
  packageId: string;
  assignedAt: string;
  assignedBy: string;
  status: "active" | "inactive";
}

export function useSubscriptions(packageId?: string) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!packageId) return;
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/packages/subscribers?packageId=${packageId}`,
      );
      setSubscriptions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignEntity = async (
    entityId: string,
    entityType: "center" | "medic" | "user",
    assign: boolean,
  ) => {
    if (!packageId) throw new Error("No package selected");
    const result = await apiPost("/api/packages/assign", {
      entityId,
      entityType,
      packageId,
      assign,
    });
    await fetchSubscriptions();
    return result;
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [packageId]);

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
    assignEntity,
  };
}
