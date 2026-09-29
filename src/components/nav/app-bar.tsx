import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/box-icon';
import { BrandMark } from '@/components/brand/brand-mark';
import { UserAvatar } from '@/components/profile/user-avatar';
import { Brand } from '@/constants/config';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

type AppBarProps = {
  onNotifications: () => void;
  onProfile: () => void;
  notificationsOpen?: boolean;
  profileOpen?: boolean;
  unread?: number;
};

export function AppBar({
  onNotifications,
  onProfile,
  notificationsOpen,
  profileOpen,
  unread = 0,
}: AppBarProps) {
  const { user } = useAuth();

  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <BrandMark size={34} />
        <Text style={styles.name}>{Brand.name}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onNotifications}
          hitSlop={8}
          style={[styles.iconBtn, notificationsOpen && styles.iconBtnOn]}>
          <AppIcon name="bell" size={22} color={Palette.ink} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable onPress={onProfile} style={[styles.avatarBtn, profileOpen && styles.avatarOn]}>
          <UserAvatar name={user?.full_name} photo={user?.photo} size={34} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,22,34,0.08)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  name: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: Palette.white,
  },
  badgeText: {
    color: Palette.ink,
    fontSize: 9,
    fontWeight: '800',
  },
  iconBtnOn: {
    backgroundColor: 'rgba(212,175,55,0.18)',
  },
  avatarBtn: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 1,
  },
  avatarOn: {
    borderColor: Palette.gold,
  },
});
