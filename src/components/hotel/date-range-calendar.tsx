import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/box-icon';
import { Palette } from '@/constants/theme';

const WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDay(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function DateRangeCalendar({
  checkIn,
  checkOut,
  onChange,
}: {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
}) {
  const initial = checkIn ? parseDay(checkIn) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const pad = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const today = ymd(new Date());
  const cells: (number | null)[] = [...Array.from({ length: pad }, () => null), ...Array.from({ length: count }, (_, i) => i + 1)];

  function pick(day: number) {
    const value = ymd(new Date(year, month, day));
    if (value < today) return;
    if (!checkIn || value <= checkIn) {
      const next = new Date(year, month, day + 1);
      onChange({ checkIn: value, checkOut: ymd(next) });
      return;
    }
    onChange({ checkIn, checkOut: value });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))} style={styles.nav}>
          <AppIcon name="chevron-left" size={20} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} style={styles.nav}>
          <AppIcon name="chevron-right" size={20} color={Palette.ink} />
        </Pressable>
      </View>
      <View style={styles.week}>
        {WEEK.map((d) => (
          <Text key={d} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={styles.slot} />;
          const value = ymd(new Date(year, month, day));
          const inRange = Boolean(checkIn && checkOut && value >= checkIn && value < checkOut);
          const isStart = value === checkIn;
          const isEnd = value === checkOut;
          const past = value < today;
          return (
            <Pressable key={value} disabled={past} onPress={() => pick(day)} style={styles.slot}>
              <View style={[styles.day, inRange && styles.inRange, (isStart || isEnd) && styles.edge, past && styles.past]}>
                <Text style={[styles.dayText, (isStart || isEnd) && styles.edgeText]}>{day}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,22,34,0.05)',
  },
  title: { color: Palette.ink, fontWeight: '800', fontSize: 16 },
  week: { flexDirection: 'row' },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    color: Palette.ink,
    opacity: 0.4,
    fontSize: 11,
    fontWeight: '700',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: { width: '14.28%', aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inRange: { backgroundColor: 'rgba(212,175,55,0.22)' },
  edge: { backgroundColor: Palette.gold },
  past: { opacity: 0.28 },
  dayText: { color: Palette.ink, fontWeight: '700' },
  edgeText: { fontWeight: '800' },
});
