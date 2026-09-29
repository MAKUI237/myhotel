import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { DateRangeCalendar, ymd } from '@/components/hotel/date-range-calendar';
import { Chips, GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette, Radius } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { money, reservationStatusLabel } from '@/lib/format';

type FrontOffice = {
  reservations: Array<{
    id: number;
    guest_name: string;
    room_number: string;
    room_type: string;
    room_photo?: string;
    check_in: string;
    check_out: string;
    status: string;
    confirmed: number;
    source: string;
    total: number;
    notes: string | null;
  }>;
  planning: {
    days: string[];
    rooms: Array<{
      number: string;
      type: string;
      days: Array<{ date: string; busy: boolean; guest?: string; status?: string }>;
    }>;
  };
  rooms: Array<{
    id: number;
    number: string;
    type: string;
    status: string;
    price_night: number;
    photo?: string;
  }>;
  transfers: Array<{ guest_name: string; from_room: string; to_room: string; reason: string; at: string }>;
};

function nightsBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export default function ReservationsScreen() {
  const { data, error, loading, reload, token, user, ready } = usePms<FrontOffice>('front-office');
  const [tab, setTab] = useState('reserver');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [checkIn, setCheckIn] = useState(ymd(new Date()));
  const [checkOut, setCheckOut] = useState(ymd(tomorrow));
  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState('');
  const [toRoom, setToRoom] = useState('');
  const [resId, setResId] = useState('');

  if (ready && !user) return <Redirect href="/welcome" />;

  const selected = data?.rooms.find((r) => r.number === room);
  const nights = nightsBetween(checkIn, checkOut);
  const occupied = useMemo(() => {
    const set = new Set<string>();
    data?.reservations
      .filter((r) => r.status !== 'annulee')
      .forEach((r) => {
        const start = new Date(r.check_in);
        const end = new Date(r.check_out);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          set.add(`${r.room_number}:${ymd(d)}`);
        }
      });
    return set;
  }, [data]);

  const available = (data?.rooms ?? []).filter((r) => {
    if (r.status === 'maintenance') return false;
    for (let d = new Date(checkIn); d < new Date(checkOut); d.setDate(d.getDate() + 1)) {
      if (occupied.has(`${r.number}:${ymd(d)}`)) return false;
    }
    return true;
  });

  async function book() {
    if (!token) return;
    if (!guest.trim() || !room) {
      const message = 'Indiquez le client et choisissez une chambre.';
      if (Platform.OS === 'web') globalThis.alert(message);
      else Alert.alert(message);
      return;
    }
    try {
      await pmsPost(token, 'reservations', {
        guest_name: guest.trim(),
        room_number: room,
        check_in: checkIn,
        check_out: checkOut,
        source: 'reservation',
      });
      setGuest('');
      await reload();
      if (Platform.OS === 'web') globalThis.alert('Réservation enregistrée.');
      else Alert.alert('Réservation enregistrée');
      setTab('sejours');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible.';
      if (Platform.OS === 'web') globalThis.alert(message);
      else Alert.alert(message);
    }
  }

  return (
    <HotelShell title="Réservations" subtitle="Calendrier, chambres disponibles et séjour client" loading={loading} error={error}>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'reserver', label: 'Réserver' },
          { id: 'planning', label: 'Occupation' },
          { id: 'sejours', label: 'Séjours' },
          { id: 'transferts', label: 'Transfert' },
        ]}
      />

      {tab === 'reserver' ? (
        <>
          <Panel>
            <Text style={styles.kicker}>Dates du séjour</Text>
            <DateRangeCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={({ checkIn: a, checkOut: b }) => {
                setCheckIn(a);
                setCheckOut(b);
                setRoom('');
              }}
            />
            <Text style={styles.meta}>
              {checkIn} → {checkOut} · {nights} nuit{nights > 1 ? 's' : ''}
            </Text>
            <TextInput placeholder="Nom du client" value={guest} onChangeText={setGuest} style={styles.input} />
          </Panel>
          {available.map((r) => (
            <Pressable key={r.id} onPress={() => setRoom(r.number)} style={[styles.roomCard, room === r.number && styles.roomOn]}>
              <Image source={{ uri: r.photo }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.roomTitle}>
                  Chambre {r.number} · {r.type}
                </Text>
                <Text style={styles.meta}>{money(r.price_night)} / nuit · {money(r.price_night * nights)} séjour</Text>
              </View>
              {room === r.number ? <StatusBadge label="Choisie" tone="gold" /> : null}
            </Pressable>
          ))}
          {!available.length ? <Text style={styles.meta}>Aucune chambre libre sur ces dates.</Text> : null}
          <GoldBtn label={selected ? `Confirmer ${selected.number}` : 'Choisir une chambre'} onPress={() => void book()} />
        </>
      ) : null}

      {tab === 'planning' && data ? (
        <Panel>
          <Text style={styles.kicker}>Occupation des 10 prochains jours</Text>
          <View style={styles.planHead}>
            <Text style={[styles.planLabel, styles.planRoom]}>Ch.</Text>
            {data.planning.days.map((d) => (
              <Text key={d} style={styles.planDay}>
                {d.slice(8)}
              </Text>
            ))}
          </View>
          {data.planning.rooms.map((row) => (
            <View key={row.number} style={styles.planHead}>
              <Text style={[styles.planLabel, styles.planRoom]}>{row.number}</Text>
              {row.days.map((cell) => (
                <View
                  key={cell.date}
                  style={[
                    styles.planCell,
                    { backgroundColor: cell.busy ? Palette.gold : 'rgba(20,22,34,0.06)' },
                  ]}
                />
              ))}
            </View>
          ))}
        </Panel>
      ) : null}

      {tab === 'sejours'
        ? data?.reservations.map((row) => (
            <Panel key={row.id}>
              <Line
                icon="calendar"
                title={`${row.guest_name} · ch. ${row.room_number}`}
                meta={`${row.check_in} → ${row.check_out} · ${money(row.total)}`}
                right={<StatusBadge label={reservationStatusLabel[row.status] ?? row.status} tone={row.status === 'annulee' ? 'muted' : 'gold'} />}
              />
              {row.status !== 'annulee' && token ? (
                <GoldBtn
                  label="Annuler"
                  onPress={() => void pmsPost(token, `reservations/${row.id}/cancel`).then(reload)}
                />
              ) : null}
            </Panel>
          ))
        : null}

      {tab === 'transferts' ? (
        <>
          <Panel>
            <Text style={styles.kicker}>Changer de chambre</Text>
            <TextInput placeholder="N° séjour" value={resId} onChangeText={setResId} keyboardType="numeric" style={styles.input} />
            <TextInput placeholder="Nouvelle chambre" value={toRoom} onChangeText={setToRoom} style={styles.input} />
            <Text style={styles.meta}>
              {data?.reservations
                .filter((r) => r.status !== 'annulee')
                .map((r) => `#${r.id} ${r.guest_name} ch.${r.room_number}`)
                .join(' · ')}
            </Text>
            <GoldBtn
              label="Transférer"
              onPress={() =>
                token
                  ? void pmsPost(token, `reservations/${Number(resId)}/transfer`, { to_room: toRoom, reason: 'Demande client' }).then(reload)
                  : undefined
              }
            />
          </Panel>
          {data?.transfers.map((row) => (
            <Panel key={row.at + row.to_room}>
              <Line icon="door-open" title={`${row.guest_name} : ${row.from_room} → ${row.to_room}`} meta={row.at} />
            </Panel>
          ))}
        </>
      ) : null}
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  kicker: { color: Palette.ink, fontWeight: '800', fontSize: 15 },
  meta: { color: Palette.ink, opacity: 0.6, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.14)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Palette.ink,
    marginTop: 8,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.08)',
  },
  roomOn: { borderColor: Palette.gold, backgroundColor: 'rgba(212,175,55,0.08)' },
  thumb: { width: 84, height: 72, borderRadius: 18, backgroundColor: Palette.ink },
  roomTitle: { color: Palette.ink, fontWeight: '800' },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  planLabel: { color: Palette.ink, fontSize: 12, fontWeight: '800' },
  planRoom: { width: 40 },
  planDay: { width: 28, color: Palette.ink, fontSize: 11, textAlign: 'center', opacity: 0.55 },
  planCell: { width: 28, height: 22, borderRadius: 8 },
});
