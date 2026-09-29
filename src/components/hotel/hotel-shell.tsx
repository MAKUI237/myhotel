import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon, type BoxIconName } from '@/components/box-icon';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { Palette, Radius } from '@/constants/theme';

type HotelShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  right?: ReactNode;
  loading?: boolean;
  error?: string | null;
};

export function HotelShell({ title, subtitle, children, right, loading, error }: HotelShellProps) {
  return (
    <WorkspaceShell>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <AppIcon name="error-circle" color={Palette.gold} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          children
        )}
      </ScrollView>
    </WorkspaceShell>
  );
}

export function StatusBadge({
  label,
  tone = 'gold',
}: {
  label: string;
  tone?: 'gold' | 'ink' | 'muted';
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'ink' && styles.badgeInk,
        tone === 'muted' && styles.badgeMuted,
      ]}>
      <Text
        style={[
          styles.badgeText,
          tone === 'ink' && styles.badgeTextInk,
          tone === 'muted' && styles.badgeTextMuted,
        ]}>
        {label}
      </Text>
    </View>
  );
}

export function ModuleCard({
  icon,
  title,
  hint,
  count,
  onPress,
  width,
}: {
  icon: BoxIconName;
  title: string;
  hint: string;
  count?: string;
  onPress: () => void;
  width: number;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.module, { width }]}>
      <View style={styles.moduleIcon}>
        <AppIcon name={icon} size={26} color={Palette.ink} />
      </View>
      {count ? <Text style={styles.moduleCount}>{count}</Text> : null}
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    color: Palette.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: Palette.ink,
    opacity: 0.55,
    fontSize: 13,
    marginTop: 4,
  },
  center: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderColor: Palette.gold,
    borderRadius: Radius.input,
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  errorText: {
    color: Palette.ink,
    fontSize: 14,
  },
  badge: {
    backgroundColor: Palette.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeInk: {
    backgroundColor: Palette.ink,
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  badgeMuted: {
    backgroundColor: 'rgba(20,22,34,0.08)',
  },
  badgeText: {
    color: Palette.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgeTextInk: {
    color: Palette.gold,
  },
  badgeTextMuted: {
    color: Palette.ink,
  },
  module: {
    backgroundColor: Palette.white,
    borderRadius: 22,
    padding: 18,
    minHeight: 168,
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  moduleCount: {
    color: Palette.gold,
    fontSize: 20,
    fontWeight: '800',
  },
  moduleTitle: {
    color: Palette.ink,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  moduleHint: {
    color: Palette.ink,
    opacity: 0.65,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
});
