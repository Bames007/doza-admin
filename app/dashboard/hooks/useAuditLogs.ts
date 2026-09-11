// hooks/useAuditLogs.ts
import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

export function useAuditLogs(limit = 100, resource?: string, userId?: string) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      let url = `/api/audit-logs?limit=${limit}`;
      if (resource) url += `&resource=${resource}`;
      if (userId) url += `&userId=${userId}`;
      const data = await apiFetch(url);
      setLogs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit, resource, userId]);

  return { logs, loading, error, refetch: fetchLogs };
}
