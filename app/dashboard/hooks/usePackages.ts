import { useEffect, useState } from "react";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/app/lib/api";

export interface Package {
  id: string;
  name: string;
  entityType: "center" | "medic" | "user";
  category: string;
  price: number;
  icon?: string;
  benefits: { name: string; description?: string }[];
  description?: string;
  createdAt: string;
  createdBy: string;
}

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      // Force fresh fetch with cache‑busting
      const data = await apiFetch(`/api/packages?t=${Date.now()}`);
      setPackages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async (
    payload: Omit<Package, "id" | "createdAt" | "createdBy">,
  ) => {
    const result = await apiPost("/api/packages", payload);
    await fetchPackages();
    return result;
  };

  const updatePackage = async (id: string, payload: Partial<Package>) => {
    const result = await apiPut("/api/packages", { id, ...payload });
    await fetchPackages();
    return result;
  };

  const deletePackage = async (id: string) => {
    await apiDelete(`/api/packages?id=${id}`);
    await fetchPackages();
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    error,
    refetch: fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  };
}
