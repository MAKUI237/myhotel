import { useCallback, useEffect, useState } from 'react';

import { notificationsRequest, readNotificationsRequest, type HotelNotification } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export function useNotifications() {
  const { token } = useAuth();
  const [items, setItems] = useState<HotelNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const payload = await notificationsRequest(token);
      setItems(payload.items);
      setUnread(payload.unread);
    } catch {
      /* keep last list */
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const mark = useCallback(
    async (id: number) => {
      if (!token) return;
      const payload = await readNotificationsRequest(token, { id });
      setItems(payload.items);
      setUnread(payload.unread);
    },
    [token],
  );

  const markAll = useCallback(async () => {
    if (!token) return;
    const payload = await readNotificationsRequest(token, { all: true });
    setItems(payload.items);
    setUnread(payload.unread);
  }, [token]);

  return { items, unread, reload, mark, markAll };
}
