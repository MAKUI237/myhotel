import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/box-icon';
import { Palette, Radius } from '@/constants/theme';
import { money } from '@/lib/format';
import { computeRoomStats, type RoomStay } from '@/lib/room-stats';

export function RoomStatsPanel({ history }: { history: RoomStay[] }) {
  const stats = computeRoomStats(history);
  const kpis = [
    { label: 'Chiffre d’affaires', value: money(stats.revenue) },
    { label: 'Clients', value: String(stats.guests) },
    { label: 'Réservations', value: String(stats.bookings) },
    { label: 'Nuits vendues', value: String(stats.nights) },
  ];

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <AppIcon name="bar-chart-alt-2" size={20} color={Palette.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Statistiques</Text>
          <Text style={styles.hint}>
            {stats.bookings
              ? `Période la plus sollicitée : ${stats.peakMonth} · ${stats.peakWeekday}`
              : 'Aucun séjour enregistré pour le moment.'}
          </Text>
        </View>
        <View style={styles.occ}>
          <Text style={styles.occValue}>{stats.occupancy}%</Text>
          <Text style={styles.occLabel}>occupation 12 mois</Text>
        </View>
      </View>

      <View style={styles.kpis}>
        {kpis.map((item) => (
          <View key={item.label} style={styles.kpi}>
            <Text style={styles.kpiValue}>{item.value}</Text>
            <Text style={styles.kpiLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Mois les plus sollicités</Text>
      {stats.months.map((row) => (
        <View key={row.label} style={styles.barRow}>
          <Text style={styles.barLabel}>{row.label.slice(0, 3)}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(row.share * 100, row.count ? 6 : 0)}%` }]} />
          </View>
          <Text style={styles.barCount}>{row.count}</Text>
        </View>
      ))}

      <Text style={styles.section}>Jours les plus demandés</Text>
      {stats.topWeekdays.length ? (
        stats.topWeekdays.map((row) => (
          <View key={row.label} style={styles.barRow}>
            <Text style={[styles.barLabel, { minWidth: 78 }]}>{row.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(row.share * 100, 8)}%` }]} />
            </View>
            <Text style={styles.barCount}>{row.count}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.hint}>Pas encore assez de données.</Text>
      )}
      {stats.cancelled ? <Text style={styles.hint}>{stats.cancelled} réservation(s) annulée(s) exclue(s) du chiffre d’affaires.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Palette.ink, fontWeight: '800', fontSize: 18 },
  hint: { color: Palette.ink, opacity: 0.6, fontSize: 12, marginTop: 2, lineHeight: 16 },
  occ: { alignItems: 'flex-end' },
  occValue: { color: Palette.gold, fontWeight: '800', fontSize: 20 },
  occLabel: { color: Palette.ink, opacity: 0.5, fontSize: 10, fontWeight: '700' },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: 'rgba(20,22,34,0.05)',
    borderRadius: 16,
    padding: 12,
  },
  kpiValue: { color: Palette.ink, fontWeight: '800', fontSize: 16 },
  kpiLabel: { color: Palette.ink, opacity: 0.55, fontSize: 11, marginTop: 4, fontWeight: '700' },
  section: { color: Palette.ink, fontWeight: '800', fontSize: 14, marginTop: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 36, color: Palette.ink, fontSize: 11, fontWeight: '700' },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(20,22,34,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: Palette.gold,
  },
  barCount: { width: 24, textAlign: 'right', color: Palette.ink, fontSize: 11, fontWeight: '800' },
});
