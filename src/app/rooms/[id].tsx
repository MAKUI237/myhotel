import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type BoxIconName } from '@/components/box-icon';
import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { RoomMedia } from '@/components/hotel/room-media';
import { GoldBtn } from '@/components/hotel/kit';
import { Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { pmsPost, roomRequest, type Room } from '@/lib/api';
import { money, roomStatusLabel } from '@/lib/format';

function statusTone(status: string): 'gold' | 'ink' | 'muted' {
  if (status === 'disponible') return 'gold';
  if (status === 'occupee' || status === 'reservee') return 'ink';
  return 'muted';
}

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, ready, token } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const canManage = user?.role === 'manager' || user?.role === 'owner';
  const canFront = canManage || user?.role === 'receptionist';

  async function load() {
    if (!token || !id) return;
    try {
      const data = await roomRequest(token, String(id));
      setRoom(data);
      setPhotoIndex(0);
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
  }, [id, token]);

  if (ready && !user) return <Redirect href="/welcome" />;
  const photos = room?.photos?.length ? room.photos : room?.photo ? [room.photo] : [];
  const current = photos[photoIndex] ?? room?.photo;

  return (
    <HotelShell
      title={room ? `Chambre ${room.number}` : 'Chambre'}
      subtitle={room ? `${room.type} · ${money(room.price_night)} / nuit` : undefined}
      loading={loading}
      error={error}>
      {room ? (
        <View style={styles.wrap}>
          <View style={styles.carousel}>
            <RoomMedia photo={current ?? room.photo} video={photoIndex === 0 ? room.video : undefined} height={300} />
            {photos.length > 1 ? (
              <>
                <Pressable
                  style={[styles.nav, styles.navLeft]}
                  onPress={() => setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}>
                  <AppIcon name="chevron-left" size={22} color={Palette.ink} />
                </Pressable>
                <Pressable
                  style={[styles.nav, styles.navRight]}
                  onPress={() => setPhotoIndex((i) => (i + 1) % photos.length)}>
                  <AppIcon name="chevron-right" size={22} color={Palette.ink} />
                </Pressable>
                <View style={styles.dots}>
                  {photos.map((_, i) => (
                    <View key={i} style={[styles.dot, i === photoIndex && styles.dotOn]} />
                  ))}
                </View>
              </>
            ) : null}
          </View>
          <View style={styles.panel}>
            <View style={styles.row}>
              <Text style={styles.kicker}>Disponibilité</Text>
              <StatusBadge label={roomStatusLabel[room.status] ?? room.status} tone={statusTone(room.status)} />
            </View>
            <Text style={styles.desc}>{room.description}</Text>
            <View style={styles.facts}>
              <Fact label="Type" value={room.type} />
              <Fact label="Étage" value={String(room.floor)} />
              <Fact label="Capacité" value={`${room.capacity} pers.`} />
              <Fact label="Tarif" value={`${money(room.price_night)} / nuit`} />
            </View>
            {token && canFront ? (
              <View style={styles.actions}>
                {canManage ? (
                  <GoldBtn
                    label="Rendre indisponible"
                    onPress={() => void pmsPost(token, 'rooms/block', { room_number: room.number }).then(load)}
                  />
                ) : null}
                <GoldBtn
                  label="Signaler urgence nettoyage"
                  onPress={() =>
                    void pmsPost(token, 'housekeeping/urgent', {
                      room_number: room.number,
                      attendant: user?.full_name,
                    }).then(load)
                  }
                />
                {canManage ? (
                  <GoldBtn
                    label="Supprimer"
                    onPress={() =>
                      void pmsPost(token, 'rooms/delete', { id: room.id }).then(() => {
                        router.back();
                      })
                    }
                  />
                ) : null}
              </View>
            ) : null}
            <Text style={styles.section}>Mobilier & équipements</Text>
            <View style={styles.equipGrid}>
              {room.equipment.map((item) => (
                <View key={item.id} style={styles.equip}>
                  <View style={styles.equipIcon}>
                    <AppIcon name={item.icon as BoxIconName} size={20} color={Palette.ink} />
                  </View>
                  <View>
                    <Text style={styles.equipName}>{item.name}</Text>
                    <Text style={styles.equipCat}>{item.category}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </HotelShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  carousel: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: Radius.card,
    backgroundColor: Palette.white,
  },
  nav: {
    position: 'absolute',
    top: '42%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotOn: {
    backgroundColor: Palette.gold,
  },
  panel: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    color: Palette.ink,
    fontWeight: '800',
    fontSize: 16,
  },
  desc: {
    color: Palette.ink,
    opacity: 0.78,
    lineHeight: 22,
    fontSize: 15,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fact: {
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: 'rgba(20,22,34,0.05)',
    borderRadius: 14,
    padding: 12,
  },
  factLabel: {
    color: Palette.ink,
    opacity: 0.6,
    fontSize: 12,
  },
  factValue: {
    color: Palette.ink,
    fontWeight: '800',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  section: {
    color: Palette.ink,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 8,
  },
  equipGrid: {
    gap: 10,
  },
  equip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipName: {
    color: Palette.ink,
    fontWeight: '700',
  },
  equipCat: {
    color: Palette.ink,
    opacity: 0.6,
    fontSize: 12,
  },
});
