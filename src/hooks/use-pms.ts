import { useCallback, useEffect, useState } from 'react';

import { pmsGet } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export function usePms<T>(path: string) {
  const { token, user, ready } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const next = await pmsGet<T>(token, path);
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, token, user, ready };
}
