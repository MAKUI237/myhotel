import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { HotelShell } from '@/components/hotel/hotel-shell';
import { GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { printHtml } from '@/lib/print';

type Data = {
  badges: Array<{
    id: number;
    guest_name: string;
    room_number: string;
    valid_from: string;
    valid_to: string;
    code: string;
    created_by: string;
  }>;
  rooms: Array<{ number: string; status: string }>;
};

export default function BadgesScreen() {
  const { user, ready } = useAuth();
  const { data, error, loading, reload, token } = usePms<Data>('workspace');
  const [guest, setGuest] = useState('Claire Dubois');
  const [room, setRoom] = useState('102');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
  if (ready && !user) return <Redirect href="/welcome" />;

  async function create() {
    if (!token) return;
    const res = await pmsPost<{ code: string }>(token, 'badges', {
      guest_name: guest,
      room_number: room,
      valid_from: from,
      valid_to: to,
      created_by: user?.full_name,
    });
    await reload();
    printHtml(
      'Badge client — accès chambre',
      `<p><strong>${guest}</strong></p>
       <p>Chambre ${room}</p>
       <p>Accès du ${from} au ${to}</p>
       <p class="total">Code ${res.code}</p>
       <p class="muted">Émis par ${user?.full_name}</p>`,
    );
  }

  return (
    <HotelShell title="Badges clients" subtitle="Accès chambre pour une date et une durée" loading={loading} error={error}>
      <Panel>
        <Text style={{ color: Palette.ink, fontWeight: '800' }}>Nouveau badge</Text>
        <TextInput value={guest} onChangeText={setGuest} placeholder="Nom du client" style={input} />
        <TextInput value={room} onChangeText={setRoom} placeholder="Chambre" style={input} />
        <TextInput value={from} onChangeText={setFrom} placeholder="Début (AAAA-MM-JJ)" style={input} />
        <TextInput value={to} onChangeText={setTo} placeholder="Fin (AAAA-MM-JJ)" style={input} />
        <GoldBtn label="Générer et imprimer" onPress={() => void create()} />
      </Panel>
      {data?.badges.map((b) => (
        <Panel key={b.id}>
          <Line
            icon="id-card"
            title={`${b.guest_name} · ch. ${b.room_number}`}
            meta={`${b.valid_from} → ${b.valid_to} · ${b.code} · ${b.created_by}`}
          />
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
};
