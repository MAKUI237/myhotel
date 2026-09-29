import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Breakpoints, Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { menuRequest, type MenuItem } from '@/lib/api';
import { money } from '@/lib/format';

export default function RestaurantScreen() {
  const { user, ready, token } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await menuRequest(token);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chargement impossible.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const groups = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [items]);

  if (ready && !user) return <Redirect href="/welcome" />;

  const columns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const gutter = isDesktop ? 32 : 16;
  const max = Math.min(width, 1320);
  const cardWidth = Math.floor((max - gutter * 2 - (columns - 1) * 16) / columns);

  return (
    <HotelShell
      back
      title="Restauration"
      subtitle="Carte du restaurant, bar et petit-déjeuner"
      loading={loading}
      error={error}>
      {groups.map(([category, list]) => (
        <View key={category} style={styles.section}>
          <Text style={styles.category}>{category}</Text>
          <View style={styles.grid}>
            {list.map((item) => (
              <View key={item.id} style={[styles.card, { width: cardWidth }]}>
                <Image source={{ uri: item.photo ?? undefined }} style={styles.photo} contentFit="cover" />
                <View style={styles.body}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{item.name}</Text>
                    <StatusBadge label={item.available ? 'Servi' : 'Indispo'} tone={item.available ? 'gold' : 'muted'} />
                  </View>
                  <Text style={styles.desc}>{item.description}</Text>
                  <Text style={styles.price}>{money(item.price)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  category: {
    color: Palette.gold,
    fontSize: 18,
    fontWeight: '800',
  },
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
    height: 140,
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
  name: {
    color: Palette.ink,
    fontWeight: '800',
    fontSize: 15,
    flex: 1,
  },
  desc: {
    color: Palette.ink,
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 18,
  },
  price: {
    color: Palette.gold,
    fontWeight: '800',
  },
});
