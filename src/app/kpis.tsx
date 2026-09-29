import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HotelShell } from '@/components/hotel/hotel-shell';
import { Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { money } from '@/lib/format';

type Kpis = {
  occupancy: number;
  adr: number;
  revpar: number;
  trevpar: number;
  revpash: number;
  revpac: number;
  goppar: number;
  capture: number;
  roomRevenue: number;
  posRevenue: number;
  venueRevenue: number;
  allRevenue: number;
  costs: number;
  occupied: number;
  roomCount: number;
};

function pct(n: number) {
  return `${Math.round(n * 1000) / 10} %`;
}

export default function KpisScreen() {
  const { data, error, loading, user, ready } = usePms<Kpis>('kpis');
  if (ready && !user) return <Redirect href="/welcome" />;

  const rows = data
    ? [
        ['Taux d’occupation', pct(data.occupancy), `${data.occupied}/${data.roomCount} chambres`],
        ['ADR', money(data.adr), 'Tarif journalier moyen'],
        ['RevPAR', money(data.revpar), 'Revenu par chambre disponible'],
        ['TrevPAR', money(data.trevpar), 'Tous revenus / chambres dispo'],
        ['RevPASH', money(data.revpash), 'Revenu horaire resto / siège'],
        ['RevPAC', money(data.revpac), 'Revenu par client'],
        ['GOPPAR', money(data.goppar), 'Profit brut par chambre'],
        ['Taux de captage', pct(data.capture), 'Clients hébergés qui dînent'],
      ]
    : [];

  return (
    <HotelShell back title="Indices de performance" subtitle="RevPAR, TrevPAR, ADR, occupation, GOPPAR" loading={loading} error={error}>
      <View style={styles.grid}>
        {rows.map((r) => (
          <View key={r[0]} style={styles.card}>
            <Text style={styles.label}>{r[0]}</Text>
            <Text style={styles.value}>{r[1]}</Text>
            <Text style={styles.hint}>{r[2]}</Text>
          </View>
        ))}
      </View>
      {data ? (
        <Panel>
          <Text style={styles.ink}>Hébergement {money(data.roomRevenue)}</Text>
          <Text style={styles.ink}>Points de vente {money(data.posRevenue)}</Text>
          <Text style={styles.ink}>Location salles {money(data.venueRevenue)}</Text>
          <Text style={styles.ink}>Charges allouées {money(data.costs)}</Text>
        </Panel>
      ) : null}
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    minWidth: 160,
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  label: { color: Palette.ink, fontSize: 12, opacity: 0.7 },
  value: { color: Palette.gold, fontSize: 22, fontWeight: '800', marginTop: 4 },
  hint: { color: Palette.ink, fontSize: 11, marginTop: 4, opacity: 0.65 },
  ink: { color: Palette.ink, fontWeight: '700' },
});
