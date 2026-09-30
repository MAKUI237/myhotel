import { Redirect } from 'expo-router';

import { HotelShell } from '@/components/hotel/hotel-shell';
import { useAuth } from '@/context/auth-context';

export function EmptyModule({ title }: { title: string }) {
  const { user, ready } = useAuth();
  if (ready && !user) return <Redirect href="/welcome" />;
  return <HotelShell title={title}>{null}</HotelShell>;
}
