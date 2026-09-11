// hooks/useMedics.ts
import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

export function useMedics() {
  const [medics, setMedics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedics = async () => {
    try {
      const data = await apiFetch("/api/doza-medics");
      setMedics(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedics();
  }, []);

  return { medics, loading, error, refetch: fetchMedics };
}
