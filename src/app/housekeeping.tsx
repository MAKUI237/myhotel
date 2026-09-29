import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { money } from '@/lib/format';

type HK = {
  tasks: Array<{
    id: number;
    room_number: string;
    attendant: string;
    priority: string;
    status: string;
    eta_minutes: number;
  }>;
  inspections: Array<{ room_number: string; inspector: string; at: string; result: string; notes: string }>;
  anomalies: Array<{ room_number: string; category: string; description: string; status: string; assigned_to: string }>;
  moves: Array<{ item: string; room_number: string; direction: string; qty: number; at: string; note: string }>;
  subcontractors: Array<{
    name: string;
    service: string;
    equipment: string;
    status: string;
    invoice_amount: number;
    invoice_status: string;
  }>;
  rooms: Array<{ number: string; type: string; floor: number; status: string }>;
  team: Array<{ full_name: string; role: string; status: string }>;
};

const STATUS_LABEL: Record<string, string> = {
  non_prise: 'Non pris en charge',
  en_cours: 'En cours de nettoyage',
  pret: 'Prêt',
};

function toneFor(status: string): 'gold' | 'ink' | 'muted' {
  if (status === 'pret') return 'gold';
  if (status === 'en_cours') return 'ink';
  return 'muted';
}

export default function HousekeepingScreen() {
  const { data, error, loading, reload, token, user, ready } = usePms<HK>('housekeeping');
  const [tab, setTab] = useState('temps-reel');
  if (ready && !user) return <Redirect href="/welcome" />;

  function setTask(taskId: number, room: string, status: string) {
    if (!token) return;
    void pmsPost(token, 'housekeeping/status', {
      room_number: room,
      task_id: taskId,
      task_status: status,
    }).then(reload);
  }

  const urgent = data?.tasks.filter((t) => t.priority === 'urgente' && t.status !== 'pret') ?? [];
  const open = data?.tasks.filter((t) => t.status !== 'pret') ?? [];
  const toClean = data?.rooms.filter((r) => r.status === 'nettoyage' || r.status === 'maintenance') ?? [];

  return (
    <HotelShell
      title="Service de chambre"
      subtitle="Chambres libres à nettoyer, urgences et statuts d’intervention"
      loading={loading}
      error={error}>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'temps-reel', label: 'Temps réel' },
          { id: 'controles', label: 'Contrôles' },
          { id: 'anomalies', label: 'Anomalies' },
          { id: 'materiel', label: 'Matériels' },
          { id: 'sous-traitants', label: 'Sous-traitants' },
        ]}
      />
      {tab === 'temps-reel' ? (
        <>
          {urgent.length ? (
            <Panel>
              <Text style={{ color: Palette.ink, fontWeight: '800' }}>Urgences</Text>
              {urgent.map((t) => (
                <Text key={t.id} style={{ color: Palette.ink }}>
                  Chambre {t.room_number} · {STATUS_LABEL[t.status] ?? t.status}
                </Text>
              ))}
            </Panel>
          ) : null}
          {toClean.map((r) => (
            <Panel key={`room-${r.number}`}>
              <Line
                icon="bed"
                title={`Chambre ${r.number} · ${r.type}`}
                meta={`Étage ${r.floor} · ${r.status === 'nettoyage' ? 'Libre à nettoyer' : 'Indisponible'}`}
                right={<StatusBadge label={r.status} tone={r.status === 'nettoyage' ? 'gold' : 'muted'} />}
              />
            </Panel>
          ))}
          {open.map((t) => (
            <Panel key={t.id}>
              <Line
                icon="droplet"
                title={`Ch. ${t.room_number} · ${t.attendant}`}
                meta={`Priorité ${t.priority} · ETA ${t.eta_minutes} min`}
                right={<StatusBadge label={STATUS_LABEL[t.status] ?? t.status} tone={toneFor(t.status)} />}
              />
              {token ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <GoldBtn label="Non pris en charge" onPress={() => setTask(t.id, t.room_number, 'non_prise')} />
                  <GoldBtn label="En cours" onPress={() => setTask(t.id, t.room_number, 'en_cours')} />
                  <GoldBtn label="Prêt" onPress={() => setTask(t.id, t.room_number, 'pret')} />
                </View>
              ) : null}
            </Panel>
          ))}
        </>
      ) : null}
      {tab === 'controles'
        ? data?.inspections.map((i) => (
            <Panel key={i.at + i.room_number}>
              <Line icon="check-circle" title={`Ch. ${i.room_number} · ${i.inspector}`} meta={`${i.at} · ${i.notes}`} />
              <StatusBadge label={i.result} tone={i.result === 'ok' ? 'gold' : 'ink'} />
            </Panel>
          ))
        : null}
      {tab === 'anomalies'
        ? data?.anomalies.map((a) => (
            <Panel key={a.description}>
              <Line icon="error-circle" title={`${a.room_number} · ${a.category}`} meta={`${a.description} · ${a.assigned_to}`} />
            </Panel>
          ))
        : null}
      {tab === 'materiel'
        ? data?.moves.map((m) => (
            <Panel key={m.at + m.item}>
              <Line icon="cabinet" title={`${m.direction === 'in' ? 'Entrée' : 'Sortie'} · ${m.item}`} meta={`${m.room_number} x${m.qty} · ${m.note}`} />
            </Panel>
          ))
        : null}
      {tab === 'sous-traitants'
        ? data?.subcontractors.map((s) => (
            <Panel key={s.name}>
              <Line
                icon="briefcase"
                title={s.name}
                meta={`${s.service} · ${s.equipment}`}
                right={<Text style={{ color: Palette.gold, fontWeight: '800' }}>{money(s.invoice_amount)}</Text>}
              />
              <StatusBadge label={`${s.status} · facture ${s.invoice_status}`} tone="gold" />
            </Panel>
          ))
        : null}
    </HotelShell>
  );
}
