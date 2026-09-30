import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { GuestBadgeCard, type GuestBadge } from '@/components/hotel/guest-badge-card';
import { FilterBar } from '@/components/hotel/filter-bar';
import { HotelShell } from '@/components/hotel/hotel-shell';
import { Breakpoints, Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { prettyStamp } from '@/lib/format';

type BadgeRow = GuestBadge & {
  id: number;
  status: string;
  state: 'actif' | 'expire' | 'annule';
};

type Payload = { items: BadgeRow[] };

export default function BadgesScreen() {
  const { width } = useWindowDimensions();
  const { data, error, loading, user, ready } = usePms<Payload>('badges');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const isDesktop = width >= Breakpoints.desktop;
  const isTablet = width >= Breakpoints.tablet;
  const cols = isDesktop ? 3 : isTablet ? 2 : 1;
  const available = (isDesktop ? width - 248 : width) - 36;
  const gap = 16;
  const cardW = Math.min(380, Math.max(240, Math.floor((available - gap * (cols - 1)) / cols)));

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const visible = useMemo(() => {
    return items.filter((item) => {
      const hay = `${item.guest_name} ${item.room_number} ${item.code} ${item.created_by ?? ''}`.toLowerCase();
      if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false;
      if (filter !== 'all' && item.state !== filter) return false;
      return true;
    });
  }, [items, query, filter]);

  if (ready && !user) return <Redirect href="/welcome" />;

  return (
    <HotelShell title="Badges clients" loading={loading && !data} error={error}>
      <FilterBar
        query={query}
        onQuery={setQuery}
        queryPlaceholder="Rechercher propriétaire, chambre, code..."
        status={filter}
        onStatus={setFilter}
        statuses={[
          { id: 'all', label: 'Tous' },
          { id: 'actif', label: 'Actifs' },
          { id: 'expire', label: 'Expirés' },
          { id: 'annule', label: 'Annulés' },
        ]}
      />
      <View style={[styles.grid, { gap }]}>
        {visible.map((item) => (
          <View key={item.id} style={[styles.cell, { width: cardW }]}>
            <GuestBadgeCard badge={item} width={cardW} />
            <Text style={styles.issued}>
              Émis par {item.created_by || 'Réception'}
              {item.created_at ? ` · ${prettyStamp(item.created_at)}` : ''}
            </Text>
            <Text style={styles.range}>
              Du {String(item.valid_from).slice(0, 10)} au {String(item.valid_to).slice(0, 10)}
            </Text>
          </View>
        ))}
      </View>
      {!visible.length ? <Text style={styles.empty}>Aucun badge dans cet historique.</Text> : null}
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    marginBottom: 8,
  },
  issued: {
    color: Palette.ink,
    opacity: 0.55,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  range: {
    color: Palette.ink,
    opacity: 0.45,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  empty: { color: Palette.ink, opacity: 0.55, textAlign: 'center', padding: 20 },
});
