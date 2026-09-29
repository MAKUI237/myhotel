import { useState } from 'react';
import { Redirect, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/box-icon';
import { AppBar } from '@/components/nav/app-bar';
import { RightDrawer } from '@/components/nav/right-drawer';
import { NotificationsPanel } from '@/components/profile/notifications-panel';
import { ProfilePanel } from '@/components/profile/profile-panel';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { isStaffRole, linksFor, ROLE_LABEL } from '@/constants/roles';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/hooks/use-notifications';
import { usePms } from '@/hooks/use-pms';
import { money } from '@/lib/format';

type Drawer = 'profile' | 'notifications' | null;

type Desk = {
  reservations: number;
  in_house: number;
  checkouts: number;
  sales_count: number;
  sales_amount: number;
  visits: number;
  badges: number;
  suggestions_open: number;
  hk_urgent: number;
  hk_open: number;
  rooms: { available: number; occupied: number; cleaning: number; blocked: number };
  recent_sales: { seller: string; total: number; item?: string; guest_name: string | null; at: string }[];
  recent_res: { guest_name: string; room_number: string; check_in: string; status: string }[];
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user, ready } = useAuth();

  if (ready && !user) return <Redirect href="/welcome" />;
  if (ready && user && isStaffRole(user.role)) {
    return <StaffHome />;
  }
  return <ClientHome />;
}

function ClientHome() {
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
      <View style={{ flex: 1 }} />
      <RightDrawer open={drawer !== null} onClose={() => setDrawer(null)}>
        {panel === 'notifications' ? (
          <NotificationsPanel
            items={items}
            unread={unread}
            onClose={() => setDrawer(null)}
            onRead={(id) => void mark(id)}
            onReadAll={() => void markAll()}
          />
        ) : (
          <ProfilePanel onClose={() => setDrawer(null)} />
        )}
      </RightDrawer>
    </View>
  );
}

function StaffHome() {
  const { user } = useAuth();
  const router = useRouter();
  const { data } = usePms<Desk>('desk');
  const shortcuts = linksFor(user?.role).filter((l) => l.href !== '/home').slice(0, 8);

  return (
    <WorkspaceShell>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.hello}>Bonjour {user?.full_name?.split(' ')[0]}</Text>
        <Text style={styles.space}>{ROLE_LABEL[(user?.role as keyof typeof ROLE_LABEL) ?? 'client']} · activité du jour</Text>

        <View style={styles.grid}>
          {user?.role === 'housekeeping' ? (
            <>
              <Stat label="Urgences" value={String(data?.hk_urgent ?? 0)} />
              <Stat label="Tâches ouvertes" value={String(data?.hk_open ?? 0)} />
              <Stat label="À nettoyer" value={String(data?.rooms?.cleaning ?? 0)} />
              <Stat label="Libres" value={String(data?.rooms?.available ?? 0)} />
            </>
          ) : (
            <>
              <Stat label="Réservations" value={String(data?.reservations ?? 0)} />
              <Stat label="En maison" value={String(data?.in_house ?? 0)} />
              <Stat label="Départs" value={String(data?.checkouts ?? 0)} />
              <Stat label="Ventes" value={money(data?.sales_amount ?? 0)} />
            </>
          )}
        </View>

        <Text style={styles.section}>Raccourcis</Text>
        <View style={styles.shortcuts}>
          {shortcuts.map((item) => (
            <Pressable key={item.href} style={styles.short} onPress={() => router.push(item.href as Href)}>
              <View style={styles.shortIcon}>
                <AppIcon name={item.icon} size={20} color={Palette.ink} />
              </View>
              <Text style={styles.shortLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {data?.recent_sales?.length ? (
          <>
            <Text style={styles.section}>Ventes du jour</Text>
            {data.recent_sales.map((s, i) => (
              <View key={`${s.seller}-${s.at}-${i}`} style={styles.row}>
                <Text style={styles.rowTitle}>
                  {s.item || 'Vente'} · {money(s.total)}
                </Text>
                <Text style={styles.rowMeta}>
                  {s.seller}
                  {s.guest_name ? ` · ${s.guest_name}` : ''} · {s.at}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {data?.recent_res?.length ? (
          <>
            <Text style={styles.section}>Réservations</Text>
            {data.recent_res.map((r, i) => (
              <View key={`${r.guest_name}-${i}`} style={styles.row}>
                <Text style={styles.rowTitle}>
                  {r.guest_name} · ch. {r.room_number}
                </Text>
                <Text style={styles.rowMeta}>
                  {r.check_in} · {r.status}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </WorkspaceShell>
  );
}

const styles = StyleSheet.create({
  client: { flex: 1, backgroundColor: Palette.white },
  page: { padding: 18, paddingBottom: 40, gap: 10 },
  hello: { color: Palette.ink, fontSize: 26, fontWeight: '800' },
  space: { color: Palette.ink, opacity: 0.55, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.08)',
  },
  statValue: { color: Palette.gold, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Palette.ink, opacity: 0.55, marginTop: 4, fontSize: 12 },
  section: { marginTop: 10, color: Palette.ink, fontWeight: '800', fontSize: 15 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  short: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: Palette.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.08)',
  },
  shortIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortLabel: { color: Palette.ink, fontWeight: '700', fontSize: 12 },
  row: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.08)',
  },
  rowTitle: { color: Palette.ink, fontWeight: '700' },
  rowMeta: { color: Palette.ink, opacity: 0.5, fontSize: 12, marginTop: 2 },
});
