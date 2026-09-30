import { Redirect, useRouter, type Href } from 'expo-router';
import { isStaffRole } from '@/constants/roles';
import { useAuth } from '@/context/auth-context';
import { HotelShell } from '@/components/hotel/hotel-shell';
import { RoleDashboard, type DashPayload } from '@/components/hotel/role-dashboard';
import { Palette } from '@/constants/theme';
import { AppBar } from '@/components/nav/app-bar';
import { RightDrawer } from '@/components/nav/right-drawer';
import { NotificationsPanel } from '@/components/profile/notifications-panel';
import { ProfilePanel } from '@/components/profile/profile-panel';
import { useNotifications } from '@/hooks/use-notifications';
import { usePms } from '@/hooks/use-pms';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Drawer = 'profile' | 'notifications' | null;

export default function HomeScreen() {
  const { user, ready } = useAuth();

  if (ready && !user) return <Redirect href="/welcome" />;
  if (ready && user && isStaffRole(user.role)) {
    return <StaffHome />;
  }
  return <ClientHome />;
}

function StaffHome() {
  const { user } = useAuth();
  const { data, error, loading } = usePms<DashPayload>('dashboard');
  return (
    <HotelShell title="Tableau de bord" loading={loading && !data} error={error}>
      {data ? <RoleDashboard data={data} role={user?.role} name={user?.full_name} /> : null}
    </HotelShell>
  );
}

function ClientHome() {
  const router = useRouter();
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [panel, setPanel] = useState<Exclude<Drawer, null>>('profile');
  const { items, unread, reload, mark, markAll } = useNotifications();

  return (
    <View style={styles.client}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: Palette.white }}>
        <AppBar
          unread={unread}
          onNotifications={() => {
            void reload();
            setPanel('notifications');
            setDrawer((c) => (c === 'notifications' ? null : 'notifications'));
          }}
          onProfile={() => {
            setPanel('profile');
            setDrawer((c) => (c === 'profile' ? null : 'profile'));
          }}
          notificationsOpen={drawer === 'notifications'}
          profileOpen={drawer === 'profile'}
        />
      </SafeAreaView>
      <RightDrawer open={drawer !== null} onClose={() => setDrawer(null)}>
          {panel === 'notifications' ? (
            <NotificationsPanel
              items={items}
              unread={unread}
              onClose={() => setDrawer(null)}
              onRead={(id) => void mark(id)}
              onReadAll={() => void markAll()}
              onOpen={(href) => {
                setDrawer(null);
                if (href) router.push(href as Href);
              }}
            />
          ) : (
            <ProfilePanel onClose={() => setDrawer(null)} />
          )}
        </RightDrawer>
    </View>
  );
}

const styles = StyleSheet.create({
  client: { flex: 1, backgroundColor: Palette.white },
});
