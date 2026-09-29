import { Redirect, useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon, type BoxIconName } from '@/components/box-icon';
import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn } from '@/components/hotel/kit';
import { Breakpoints, Palette, Radius } from '@/constants/theme';
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
  const isDesktop = width >= Breakpoints.desktop;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const canManage = user?.role === 'manager' || user?.role === 'owner';
  const canFront = canManage || user?.role === 'receptionist';

  async function load() {
    if (!token) return;
    try {
      const data = await roomsRequest(token);
      setRooms(data);
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
  const columns = width >= 1180 ? 3 : width >= 760 ? 2 : 1;
  const gutter = isDesktop ? 32 : 16;
  const max = Math.min(width, 1320);
  const cardWidth = Math.floor((max - gutter * 2 - (columns - 1) * 16) / columns);

  return (
    <HotelShell
      title="Gestion des chambres"
      subtitle="Types, photos, tarifs FCFA, indisponibilité et urgence entretien"
      loading={loading}
      error={error}>
      <Chips
        value={type}
        onChange={setType}
        options={types.map((id) => ({ id, label: id === 'all' ? 'Tous les types' : id }))}
      />
      <View style={styles.grid}>
        {visible.map((room) => (
          <Pressable
            key={room.id}
            onPress={() => router.push(`/rooms/${room.id}` as Href)}
            style={[styles.card, { width: cardWidth }]}>
            <Image source={{ uri: room.photo }} style={styles.photo} contentFit="cover" />
            <View style={styles.body}>
              <View style={styles.row}>
                <Text style={styles.number}>Chambre {room.number}</Text>
                <StatusBadge label={roomStatusLabel[room.status] ?? room.status} tone={statusTone(room.status)} />
              </View>
              <Text style={styles.meta}>
                {room.type} · Étage {room.floor} · {room.capacity} pers.
              </Text>
              <Text style={styles.price}>{money(room.price_night)} / nuit</Text>
              <View style={styles.equipRow}>
                {room.equipment.slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.equipChip}>
                    <AppIcon name={item.icon as BoxIconName} size={14} color={Palette.ink} />
                    <Text style={styles.equipLabel}>{item.name}</Text>
                  </View>
                ))}
              </View>
              {token && canFront ? (
                <View style={styles.actions}>
                  {canManage ? (
                    <GoldBtn
                      label="Indisponible"
                      onPress={() => void pmsPost(token, 'rooms/block', { room_number: room.number }).then(load)}
                    />
                  ) : null}
                  <GoldBtn
                    label="Urgence nettoyage"
                    onPress={() =>
                      void pmsPost(token, 'housekeeping/urgent', {
                        room_number: room.number,
                        attendant: user?.full_name,
                      }).then(load)
                    }
                  />
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  photo: {
    width: '100%',
    height: 168,
    backgroundColor: Palette.ink,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  number: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: Palette.ink,
    opacity: 0.7,
    fontSize: 13,
  },
  price: {
    color: Palette.gold,
    fontWeight: '800',
    fontSize: 15,
  },
  equipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20,22,34,0.06)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  equipLabel: {
    color: Palette.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});
