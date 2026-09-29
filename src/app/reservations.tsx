import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { money, reservationStatusLabel } from '@/lib/format';
import { printReceipt } from '@/lib/print';

type FrontOffice = {
  reservations: Array<{
    id: number;
    guest_name: string;
    room_number: string;
    room_type: string;
    check_in: string;
    check_out: string;
    status: string;
    confirmed: number;
    source: string;
    total: number;
    notes: string | null;
    guest_vip: number;
  }>;
  planning: {
    days: string[];
    rooms: Array<{
      number: string;
      type: string;
      days: Array<{
        date: string;
        busy: boolean;
        guest?: string;
        status?: string;
        confirmed?: boolean;
        source?: string;
      }>;
    }>;
  };
  lost_items: Array<{
    id: number;
    guest_name: string;
    room_number: string;
    item: string;
    kind: string;
    status: string;
    location: string;
  }>;
  visits: Array<{
    visitor_name: string;
    host_name: string;
    room_number: string;
    purpose: string;
    arrived_at: string;
    left_at: string | null;
  }>;
  vip_tasks: Array<{
    guest_name: string;
    room_number: string;
    service: string;
    scheduled_at: string;
    status: string;
  }>;
  transfers: Array<{ guest_name: string; from_room: string; to_room: string; reason: string; at: string }>;
  charges: Array<{ guest_name: string; source: string; label: string; amount: number; outlet: string | null }>;
  rooms: Array<{ number: string; status: string; type: string }>;
};

function cellColor(cell: FrontOffice['planning']['rooms'][0]['days'][0]) {
  if (!cell.busy) return 'transparent';
  if (cell.status === 'en_cours') return Palette.ink;
  if (!cell.confirmed) return 'rgba(255,255,255,0.2)';
  return Palette.gold;
}

export default function ReservationsScreen() {
  const { data, error, loading, reload, token, user, ready } = usePms<FrontOffice>('front-office');
  const [tab, setTab] = useState('planning');
  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState('103');
  const [note, setNote] = useState('');
  const [toRoom, setToRoom] = useState('');
  const [reason, setReason] = useState('Le client préfère une autre chambre');
  const [resId, setResId] = useState('');

  const roomsFree = useMemo(() => data?.rooms.filter((r) => r.status === 'disponible') ?? [], [data]);

  if (ready && !user) return <Redirect href="/welcome" />;

  async function createStay(source: 'reservation' | 'walk_in') {
    if (!token) return;
    try {
      await pmsPost(token, 'reservations', { guest_name: guest, room_number: room, source, notes: note });
      setGuest('');
      setNote('');
      await reload();
      printReceipt({
        title: source === 'walk_in' ? 'Reçu walk-in' : 'Reçu de réservation',
        actor: user?.full_name,
        rows: [
          ['Client', guest],
          ['Chambre', room],
          ['Type', source === 'walk_in' ? 'Walk-in' : 'Réservation'],
          ['Notes', note || '—'],
          ['Opérateur', user?.full_name || 'Réception'],
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible.';
      if (Platform.OS === 'web') globalThis.alert(message);
      else Alert.alert(message);
    }
  }

  return (
    <HotelShell
      back
      title="Réservation"
      subtitle="Planning, walk-in, transferts, consignes, VIP, visites"
      loading={loading}
      error={error}>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'planning', label: 'Planning' },
          { id: 'saisie', label: 'Enregistrer' },
          { id: 'sejours', label: 'Séjours' },
          { id: 'transferts', label: 'Transferts' },
          { id: 'consignes', label: 'Consignes' },
          { id: 'vip', label: 'VIP' },
          { id: 'visites', label: 'Visites' },
          { id: 'folio', label: 'Facturation client' },
        ]}
      />

      {tab === 'planning' && data ? (
        <Panel>
          <Text style={styles.legend}>
            Or = confirmée · Blanc = non confirmée · Encre = en chambre · Vide = libre
          </Text>
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
                    { backgroundColor: cellColor(cell) },
                    cell.busy && !cell.confirmed ? styles.planDash : null,
                  ]}
                />
              ))}
            </View>
          ))}
          {data.rooms.map((r) => (
            <Text key={r.number} style={styles.live}>
              {r.number} · {r.type} · {r.status}
            </Text>
          ))}
        </Panel>
      ) : null}

      {tab === 'saisie' ? (
        <Panel>
          <Text style={styles.kicker}>Nouvelle réservation ou walk-in</Text>
          <TextInput placeholder="Nom du client" value={guest} onChangeText={setGuest} style={styles.input} />
          <TextInput placeholder="Chambre (ex. 103)" value={room} onChangeText={setRoom} style={styles.input} />
          <TextInput placeholder="Consignes / notes" value={note} onChangeText={setNote} style={styles.input} />
          <Text style={styles.meta}>Libres : {roomsFree.map((r) => r.number).join(', ') || '—'}</Text>
          <View style={styles.row}>
            <GoldBtn label="Enregistrer réservation" onPress={() => void createStay('reservation')} />
            <GoldBtn label="Walk-in (arrivée)" onPress={() => void createStay('walk_in')} />
          </View>
        </Panel>
      ) : null}

      {tab === 'sejours'
        ? data?.reservations.map((row) => (
            <Panel key={row.id}>
              <Line
                icon="calendar"
                title={`${row.guest_name} · ${row.room_number} ${row.room_type}`}
                meta={`${row.check_in} → ${row.check_out} · ${row.source === 'walk_in' ? 'Walk-in' : 'Résa'} · ${money(row.total)}`}
                right={
                  <StatusBadge
                    label={
                      row.confirmed ? reservationStatusLabel[row.status] ?? row.status : 'Non confirmée'
                    }
                    tone={row.confirmed ? (row.status === 'en_cours' ? 'ink' : 'gold') : 'muted'}
                  />
                }
              />
              {row.guest_vip ? <Text style={styles.vip}>Client VIP</Text> : null}
              {row.notes ? <Text style={styles.meta}>{row.notes}</Text> : null}
              <View style={styles.row}>
                {!row.confirmed && token ? (
                  <GoldBtn
                    label="Confirmer"
                    onPress={() => void pmsPost(token, `reservations/${row.id}/confirm`).then(reload)}
                  />
                ) : null}
                <GoldBtn
                  label="Imprimer le reçu"
                  onPress={() =>
                    printReceipt({
                      title: 'Reçu de réservation',
                      actor: user?.full_name,
                      total: money(row.total),
                      rows: [
                        ['Client', row.guest_name],
                        ['Chambre', `${row.room_number} · ${row.room_type}`],
                        ['Arrivée', row.check_in],
                        ['Départ', row.check_out],
                        ['Statut', row.status],
                      ],
                    })
                  }
                />
              </View>
            </Panel>
          ))
        : null}

      {tab === 'transferts' ? (
        <>
          <Panel>
            <Text style={styles.kicker}>Transférer un client</Text>
            <TextInput
              placeholder="N° séjour (id)"
              value={resId}
              onChangeText={setResId}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput placeholder="Nouvelle chambre" value={toRoom} onChangeText={setToRoom} style={styles.input} />
            <TextInput placeholder="Motif" value={reason} onChangeText={setReason} style={styles.input} />
            <Text style={styles.meta}>Séjours : {data?.reservations.map((r) => `#${r.id} ${r.guest_name} ch.${r.room_number}`).join(' · ')}</Text>
            <GoldBtn
              label="Effectuer le transfert"
              onPress={() =>
                token
                  ? void pmsPost(token, `reservations/${Number(resId)}/transfer`, {
                      to_room: toRoom,
                      reason,
                    }).then(reload)
                  : undefined
              }
            />
          </Panel>
          {data?.transfers.map((row) => (
            <Panel key={row.at + row.to_room}>
              <Line
                icon="door-open"
                title={`${row.guest_name} : ${row.from_room} → ${row.to_room}`}
                meta={`${row.reason} · ${row.at}`}
              />
            </Panel>
          ))}
        </>
      ) : null}

      {tab === 'consignes'
        ? data?.lost_items.map((row) => (
            <Panel key={row.id}>
              <Line
                icon="lock-alt"
                title={`${row.item} · ${row.kind}`}
                meta={`${row.guest_name} · ch. ${row.room_number} · ${row.location}`}
                right={<StatusBadge label={row.status} tone={row.status === 'restitue' ? 'gold' : 'ink'} />}
              />
              {row.status !== 'restitue' && token ? (
                <GoldBtn
                  label="Marquer restitué"
                  onPress={() => void pmsPost(token, 'lost-items/return', { id: row.id }).then(reload)}
                />
              ) : null}
            </Panel>
          ))
        : null}

      {tab === 'vip'
        ? data?.vip_tasks.map((row) => (
            <Panel key={row.service + row.scheduled_at}>
              <Line icon="star" title={`${row.guest_name} · ${row.service}`} meta={`${row.room_number} · ${row.scheduled_at}`} />
            </Panel>
          ))
        : null}

      {tab === 'visites'
        ? data?.visits.map((row) => (
            <Panel key={row.arrived_at + row.visitor_name}>
              <Line
                icon="group"
                title={row.visitor_name}
                meta={`Chez ${row.host_name} (${row.room_number}) · ${row.purpose} · ${row.arrived_at}`}
              />
            </Panel>
          ))
        : null}

      {tab === 'folio'
        ? data?.charges.map((row) => (
            <Panel key={row.label + row.amount}>
              <Line
                icon="receipt"
                title={`${row.guest_name} · ${row.label}`}
                meta={`${row.source}${row.outlet ? ` · ${row.outlet}` : ''}`}
                right={<Text style={styles.amt}>{money(row.amount)}</Text>}
              />
            </Panel>
          ))
        : null}
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  legend: { color: Palette.ink, fontSize: 12, opacity: 0.7 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planLabel: { color: Palette.ink, fontSize: 11, fontWeight: '800' },
  planRoom: { width: 36 },
  planDay: { width: 22, color: Palette.ink, fontSize: 10, textAlign: 'center', opacity: 0.6 },
  planCell: { width: 22, height: 16, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(20,22,34,0.15)' },
  planDash: { borderStyle: 'dashed', borderColor: Palette.gold },
  live: { color: Palette.ink, fontSize: 12, opacity: 0.7 },
  kicker: { color: Palette.ink, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: Palette.ink,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Palette.ink,
  },
  meta: { color: Palette.ink, opacity: 0.65, fontSize: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vip: { color: Palette.gold, fontWeight: '800', fontSize: 12 },
  amt: { color: Palette.gold, fontWeight: '800' },
});
