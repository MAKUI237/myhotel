import { Redirect, useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn } from '@/components/hotel/kit';
import { Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { pmsPost, roomsRequest, type Room } from '@/lib/api';
import { money, roomStatusLabel } from '@/lib/format';

function statusTone(status: string): 'gold' | 'ink' | 'muted' {
  if (status === 'disponible') return 'gold';
  if (status === 'occupee' || status === 'reservee') return 'ink';
  return 'muted';
}

export default function RoomsScreen() {
  const router = useRouter();
  const { user, ready, token } = useAuth();
  const { width } = useWindowDimensions();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [form, setForm] = useState({ number: '', type: 'Deluxe', price_night: '72000', photo: '', video: '' });
  const canManage = user?.role === 'manager' || user?.role === 'owner';

  async function load() {
    if (!token) return;
    try {
      setRooms(await roomsRequest(token));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (ready && !user) return <Redirect href="/welcome" />;

  const types = useMemo(() => ['all', ...Array.from(new Set(rooms.map((r) => r.type)))], [rooms]);
  const visible = rooms.filter((r) => type === 'all' || r.type === type);
  const columns = width >= 1180 ? 3 : width >= 720 ? 2 : 1;
  const cardWidth = Math.floor((Math.min(width, 1200) - 36 - (columns - 1) * 16) / columns);

  return (
    <HotelShell title="Chambres" subtitle="Photos, types, tarifs FCFA et vidéo de présentation" loading={loading} error={error}>
      <Chips value={type} onChange={setType} options={types.map((id) => ({ id, label: id === 'all' ? 'Tous' : id }))} />
      {canManage && token ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Ajouter une chambre</Text>
          <TextInput placeholder="Numéro" value={form.number} onChangeText={(v) => setForm({ ...form, number: v })} style={styles.input} />
          <TextInput placeholder="Type" value={form.type} onChangeText={(v) => setForm({ ...form, type: v })} style={styles.input} />
          <TextInput placeholder="Prix / nuit FCFA" value={form.price_night} onChangeText={(v) => setForm({ ...form, price_night: v })} keyboardType="numeric" style={styles.input} />
          <TextInput placeholder="URL photo" value={form.photo} onChangeText={(v) => setForm({ ...form, photo: v })} style={styles.input} />
          <TextInput placeholder="URL vidéo (optionnel)" value={form.video} onChangeText={(v) => setForm({ ...form, video: v })} style={styles.input} />
          <GoldBtn
            label="Enregistrer"
            onPress={() =>
              void pmsPost(token, 'rooms/save', {
                ...form,
                price_night: Number(form.price_night),
              }).then(() => {
                setForm({ number: '', type: 'Deluxe', price_night: '72000', photo: '', video: '' });
                return load();
              })
            }
          />
        </View>
      ) : null}
      <View style={styles.grid}>
        {visible.map((room) => (
          <Pressable key={room.id} onPress={() => router.push(`/rooms/${room.id}` as Href)} style={[styles.card, { width: cardWidth }]}>
            <Image source={{ uri: room.photo }} style={styles.photo} contentFit="cover" />
            {room.video ? (
              <View style={styles.play}>
                <Text style={styles.playText}>Vidéo</Text>
              </View>
            ) : null}
            <View style={styles.body}>
              <View style={styles.row}>
                <Text style={styles.number}>{room.number}</Text>
                <StatusBadge label={roomStatusLabel[room.status] ?? room.status} tone={statusTone(room.status)} />
              </View>
              <Text style={styles.type}>{room.type}</Text>
              <Text style={styles.meta}>
                Étage {room.floor} · {room.capacity} pers.
              </Text>
              <Text style={styles.price}>{money(room.price_night)} / nuit</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.06)',
  },
  photo: { width: '100%', height: 190, backgroundColor: Palette.ink },
  play: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: Palette.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  playText: { color: Palette.ink, fontWeight: '800', fontSize: 11 },
  body: { padding: 16, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { color: Palette.ink, fontSize: 22, fontWeight: '800' },
  type: { color: Palette.ink, fontWeight: '700' },
  meta: { color: Palette.ink, opacity: 0.55, fontSize: 13 },
  price: { color: Palette.gold, fontWeight: '800', marginTop: 6, fontSize: 16 },
  form: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.06)',
  },
  formTitle: { color: Palette.ink, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.12)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Palette.ink,
  },
});
