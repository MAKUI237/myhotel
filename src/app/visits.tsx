import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { HotelShell } from '@/components/hotel/hotel-shell';
import { GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';

type Data = {
  visits: Array<{
    visitor_name: string;
    host_name: string;
    room_number: string;
    purpose: string;
    arrived_at: string;
    left_at: string | null;
  }>;
};

export default function VisitsScreen() {
  const { user, ready } = useAuth();
  const { data, error, loading, reload, token } = usePms<Data>('workspace');
  const [visitor, setVisitor] = useState('');
  const [host, setHost] = useState('');
  const [room, setRoom] = useState('');
  const [purpose, setPurpose] = useState('Visite');
  if (ready && !user) return <Redirect href="/welcome" />;

  return (
    <HotelShell title="Visites" subtitle="Enregistrement des visiteurs" loading={loading} error={error}>
      <Panel>
        <Text style={{ color: Palette.ink, fontWeight: '800' }}>Marquer une visite</Text>
        <TextInput value={visitor} onChangeText={setVisitor} placeholder="Visiteur" style={input} />
        <TextInput value={host} onChangeText={setHost} placeholder="Client / hôte" style={input} />
        <TextInput value={room} onChangeText={setRoom} placeholder="Chambre" style={input} />
        <TextInput value={purpose} onChangeText={setPurpose} placeholder="Motif" style={input} />
        <GoldBtn
          label="Enregistrer la visite"
          onPress={() =>
            void pmsPost(token || '', 'visits', {
              visitor_name: visitor,
              host_name: host,
              room_number: room,
              purpose,
            }).then(reload)
          }
        />
      </Panel>
      {data?.visits.map((v, i) => (
        <Panel key={`${v.visitor_name}-${i}`}>
          <Line icon="group" title={`${v.visitor_name} → ${v.host_name}`} meta={`Ch. ${v.room_number} · ${v.purpose} · ${v.arrived_at}`} />
        </Panel>
      ))}
    </HotelShell>
  );
}

const input = {
  borderWidth: 1,
  borderColor: Palette.ink,
  borderRadius: 10,
  padding: 10,
  color: Palette.ink,
  marginTop: 8,
};
