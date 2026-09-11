// hooks/useCenters.ts
import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

export function useCenters() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/doza-centers");
      setCenters(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  return { centers, loading, error, refetch: fetchCenters };
}
