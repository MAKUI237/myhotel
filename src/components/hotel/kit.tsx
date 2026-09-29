import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type BoxIconName } from '@/components/box-icon';
import { Palette, Radius } from '@/constants/theme';

export function Chips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          onPress={() => onChange(opt.id)}
          style={[styles.chip, value === opt.id && styles.chipOn]}>
          <Text style={[styles.chipText, value === opt.id && styles.chipTextOn]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export function Line({
  title,
  meta,
  right,
  icon,
}: {
  title: string;
  meta?: string;
  right?: ReactNode;
  icon?: BoxIconName;
}) {
  return (
    <View style={styles.line}>
      {icon ? (
        <View style={styles.icon}>
          <AppIcon name={icon} size={18} color={Palette.ink} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function GoldBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={styles.btn}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: Palette.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipOn: {
    backgroundColor: Palette.gold,
  },
  chipText: {
    color: Palette.gold,
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextOn: {
    color: Palette.ink,
  },
  panel: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Palette.ink,
    fontWeight: '800',
    fontSize: 14,
  },
  meta: {
    color: Palette.ink,
    opacity: 0.65,
    fontSize: 12,
  },
  btn: {
    backgroundColor: Palette.gold,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: {
    color: Palette.ink,
    fontWeight: '800',
    fontSize: 12,
  },
});
