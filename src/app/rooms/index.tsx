import { Image } from 'expo-image';
import { Redirect, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { FilterBar } from '@/components/hotel/filter-bar';
import { ConfirmDialog, GoldBtn } from '@/components/hotel/kit';
import { AppIcon } from '@/components/box-icon';
import { Breakpoints, Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { pmsGet, pmsPost, roomsRequest, type Room } from '@/lib/api';
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
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<Room | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ room: Room; next: 'maintenance' | 'disponible' } | null>(null);
  const [openIssues, setOpenIssues] = useState(0);
  const canManage = user?.role === 'manager' || user?.role === 'owner';

  async function load() {
    if (!token) return;
    try {
      setRooms(await roomsRequest(token));
      if (user?.role === 'manager' || user?.role === 'owner') {
        try {
          const payload = await pmsGet<{ open: number }>(token, 'issues');
          setOpenIssues(payload.open);
        } catch {
          setOpenIssues(0);
        }
      }
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

  const visible = rooms.filter((room) => {
    const hay = `${room.number} ${room.type} ${room.description}`.toLowerCase();
    if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false;
    if (status !== 'all' && room.status !== status) return false;
    return true;
  });
  const isDesktop = width >= Breakpoints.desktop;
  const columns = isDesktop ? 3 : width >= Breakpoints.tablet ? 2 : 1;
  const available = (isDesktop ? width - 248 : width) - 36;
  const cardWidth = Math.max(150, Math.floor((available - (columns - 1) * 16) / columns));

  if (ready && !user) return <Redirect href="/welcome" />;
  if (ready && user?.role === 'receptionist') return <Redirect href="/home" />;

  async function remove() {
    if (!token || !pendingDelete) return;
    await pmsPost(token, 'rooms/delete', { id: pendingDelete.id });
    setPendingDelete(null);
    await load();
  }

  async function applyStatus() {
    if (!token || !pendingStatus) return;
    await pmsPost(token, 'rooms/status', { id: pendingStatus.room.id, status: pendingStatus.next });
    setPendingStatus(null);
    await load();
  }

  return (
    <HotelShell
      title="Chambres"
      loading={loading}
      error={error}
      right={
        canManage ? (
          <GoldBtn compact icon="plus" label="Ajouter" onPress={() => router.push('/rooms/form' as Href)} />
        ) : null
      }>
      {canManage && openIssues > 0 ? (
        <Pressable onPress={() => router.push('/issues' as Href)} style={styles.banner}>
          <AppIcon name="error-circle" size={18} color={Palette.ink} />
          <Text style={styles.bannerText}>
            {openIssues} signalement{openIssues > 1 ? 's' : ''} à traiter
          </Text>
        </Pressable>
      ) : null}
      <FilterBar
        query={query}
        onQuery={setQuery}
        queryPlaceholder="Rechercher une chambre..."
        status={status}
        onStatus={setStatus}
        statuses={[
          { id: 'all', label: 'Tous' },
          { id: 'disponible', label: 'Disponible' },
          { id: 'occupee', label: 'Occupée' },
          { id: 'reservee', label: 'Réservée' },
          { id: 'nettoyage', label: 'Nettoyage' },
          { id: 'maintenance', label: 'Maintenance' },
        ]}
      />
      <View style={styles.grid}>
        {visible.map((room) => (
          <View key={room.id} style={[styles.card, { width: cardWidth }]}>
            <View style={styles.photoWrap}>
              <Pressable onPress={() => router.push(`/rooms/${room.id}` as Href)}>
                <Image source={{ uri: room.photo }} style={styles.photo} contentFit="cover" />
              </Pressable>
              {room.video || room.videos?.length ? (
                <View style={styles.play}>
                  <Text style={styles.playText}>Vidéo</Text>
                </View>
              ) : null}
              {canManage && room.status !== 'maintenance' && room.status !== 'nettoyage' ? (
                <Pressable
                  style={styles.photoBtn}
                  onPress={() => setPendingStatus({ room, next: 'maintenance' })}>
                  <AppIcon name="cog" size={16} color={Palette.ink} />
                </Pressable>
              ) : null}
              {canManage && (room.status === 'maintenance' || room.status === 'nettoyage') ? (
                <Pressable
                  style={[styles.photoBtn, styles.photoBtnReady]}
                  onPress={() => setPendingStatus({ room, next: 'disponible' })}>
                  <AppIcon name="check-circle" size={16} color={Palette.gold} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.body}>
              <View style={styles.row}>
                <Text style={styles.number}>{room.number}</Text>
                <StatusBadge label={roomStatusLabel[room.status] ?? room.status} tone={statusTone(room.status)} />
              </View>
              <Text style={styles.type}>{room.type}</Text>
              <Text style={styles.meta}>
                Étage {room.floor} · {room.capacity} pers. · {room.equipment?.length ?? 0} équipements
              </Text>
              <Text style={styles.price}>{money(room.price_night)} / nuit</Text>
              <View style={styles.actions}>
                <GoldBtn block tiny icon="show" label="Voir" onPress={() => router.push(`/rooms/${room.id}` as Href)} />
                {canManage ? (
                  <>
                    <GoldBtn block tiny icon="edit" label="Modifier" onPress={() => router.push(`/rooms/form?id=${room.id}` as Href)} />
                    <GoldBtn block tiny icon="trash" label="Supprimer" variant="ink" onPress={() => setPendingDelete(room)} />
                  </>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>
      {!visible.length ? <Text style={styles.empty}>Aucune chambre ne correspond.</Text> : null}
      <ConfirmDialog
        visible={!!pendingDelete}
        title="Confirmer la suppression"
        message={`Supprimer la chambre ${pendingDelete?.number} ?`}
        confirmLabel="Supprimer"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void remove()}
      />
      <ConfirmDialog
        visible={!!pendingStatus}
        title={pendingStatus?.next === 'maintenance' ? 'Mettre en maintenance' : 'Marquer prête'}
        message={
          pendingStatus?.next === 'maintenance'
            ? `La chambre ${pendingStatus?.room.number} sera hors service jusqu’à ce que le gérant la marque prête.`
            : `La chambre ${pendingStatus?.room.number} redevient disponible.`
        }
        confirmLabel={pendingStatus?.next === 'maintenance' ? 'Maintenance' : 'Prête'}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => void applyStatus()}
      />
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.gold,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 4,
    borderBottomColor: Palette.ink,
  },
  bannerText: { color: Palette.ink, fontWeight: '800', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%' },
  empty: { color: Palette.ink, opacity: 0.6 },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.06)',
  },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: Palette.ink },
  photoBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: Palette.ink,
  },
  photoBtnReady: { backgroundColor: Palette.ink },
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
  body: { padding: 16, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { color: Palette.ink, fontSize: 22, fontWeight: '800' },
  type: { color: Palette.ink, fontWeight: '700' },
  meta: { color: Palette.ink, opacity: 0.55, fontSize: 13 },
  price: { color: Palette.gold, fontWeight: '800', marginTop: 4, fontSize: 16 },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginTop: 10 },
});
