import { type ReactNode, useState } from 'react';
import { Redirect, usePathname, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/box-icon';
import { BrandMark } from '@/components/brand/brand-mark';
import { AppBar } from '@/components/nav/app-bar';
import { RightDrawer } from '@/components/nav/right-drawer';
import { NotificationsPanel } from '@/components/profile/notifications-panel';
import { ProfilePanel } from '@/components/profile/profile-panel';
import { Brand } from '@/constants/config';
import { linksFor, ROLE_LABEL, isStaffRole } from '@/constants/roles';
import { Breakpoints, Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/hooks/use-notifications';

type Drawer = 'profile' | 'notifications' | null;

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [panel, setPanel] = useState<Exclude<Drawer, null>>('profile');
  const { items, unread, reload, mark, markAll } = useNotifications();
  const links = linksFor(user?.role);

  if (ready && !user) return <Redirect href="/welcome" />;
  if (ready && user && !isStaffRole(user.role)) {
    return <Redirect href="/home" />;
  }

  function go(href: string) {
    router.push(href as Href);
  }

  const nav = links.map((item) => {
    const active = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
    return (
      <Pressable
        key={item.href}
        onPress={() => go(item.href)}
        style={[
          isDesktop ? styles.navItem : styles.dockItem,
          active && (isDesktop ? styles.navItemOn : styles.dockOn),
        ]}>
        <AppIcon name={item.icon} size={isDesktop ? 20 : 22} color={active ? Palette.gold : isDesktop ? Palette.white : Palette.ink} />
        <Text
          numberOfLines={1}
          style={[
            isDesktop ? styles.navLabel : styles.dockLabel,
            active && (isDesktop ? styles.navLabelOn : styles.dockLabelOn),
          ]}>
          {item.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View style={styles.screen}>
      <StatusBar style={isDesktop ? 'light' : 'dark'} />
      {isDesktop ? (
        <View style={styles.desktop}>
          <View style={styles.sidebar}>
            <View style={styles.brandBlock}>
              <BrandMark size={42} />
              <View>
                <Text style={styles.brand}>{Brand.name}</Text>
                <Text style={styles.role}>{ROLE_LABEL[user?.role as keyof typeof ROLE_LABEL] ?? ''}</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navList}>
              {nav}
            </ScrollView>
          </View>
          <View style={styles.main}>
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
            <View style={styles.body}>{children}</View>
          </View>
        </View>
      ) : (
        <View style={styles.mobile}>
          <SafeAreaView edges={['top']} style={styles.mobileTop}>
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
          <View style={styles.body}>{children}</View>
          <SafeAreaView edges={['bottom']} style={styles.dockWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dock}>
              {nav}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.white,
    overflow: 'hidden',
  },
  desktop: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 248,
    backgroundColor: Palette.ink,
    paddingTop: 18,
    paddingHorizontal: 12,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.25)',
    marginBottom: 12,
  },
  brand: {
    color: Palette.gold,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.6,
  },
  role: {
    color: Palette.white,
    opacity: 0.7,
    fontSize: 12,
    marginTop: 2,
  },
  navList: {
    gap: 4,
    paddingBottom: 24,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  navItemOn: {
    backgroundColor: 'rgba(212,175,55,0.16)',
  },
  navLabel: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  navLabelOn: {
    color: Palette.gold,
    fontWeight: '800',
  },
  main: {
    flex: 1,
    backgroundColor: '#F4F5F8',
  },
  body: {
    flex: 1,
  },
  mobile: {
    flex: 1,
    backgroundColor: '#F4F5F8',
  },
  mobileTop: {
    backgroundColor: Palette.white,
  },
  dockWrap: {
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20,22,34,0.08)',
  },
  dock: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    alignItems: 'center',
  },
  dockItem: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 14,
  },
  dockOn: {
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderRadius: 14,
  },
  dockLabel: {
    color: Palette.ink,
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 72,
    textAlign: 'center',
  },
  dockLabelOn: {
    color: Palette.gold,
    fontWeight: '800',
  },
});
