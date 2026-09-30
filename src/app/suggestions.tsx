import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/box-icon';
import { FilterBar } from '@/components/hotel/filter-bar';
import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { GoldBtn } from '@/components/hotel/kit';
import { Breakpoints, Palette, Radius } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { prettyStamp } from '@/lib/format';

type Suggestion = {
  id: number;
  author: string;
  role?: string | null;
  message: string;
  reply?: string | null;
  status: string;
  created_at: string;
};

type Payload = { items: Suggestion[] };

function statusLabel(status: string) {
  if (status === 'approuvee' || status === 'traitee') return 'Approuvée';
  if (status === 'refusee') return 'Refusée';
  return 'En attente';
}

function statusTone(status: string): 'gold' | 'ink' | 'muted' {
  if (status === 'approuvee' || status === 'traitee') return 'gold';
  if (status === 'refusee') return 'ink';
  return 'muted';
}

export default function SuggestionsScreen() {
  const { data, error, loading, reload, token, user, ready } = usePms<Payload>('suggestions');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isOwner = user?.role === 'owner';
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;
  const cols = width >= Breakpoints.tablet ? 3 : 1;
  const available = (isDesktop ? width - 248 : width) - 36;
  const cardWidth = Math.max(160, Math.floor((available - (cols - 1) * 12) / cols));
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const visible = useMemo(() => {
    return items.filter((item) => {
      const hay = `${item.author} ${item.message}`.toLowerCase();
      if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false;
      if (filter === 'all') return true;
      if (filter === 'ouverte') return item.status === 'ouverte';
      if (filter === 'approuvee') return item.status === 'approuvee' || item.status === 'traitee';
      if (filter === 'refusee') return item.status === 'refusee';
      return item.status === filter;
    });
  }, [items, query, filter]);

  async function send() {
    if (!token || saving || isOwner) return;
    if (!draft.trim()) {
      setFormError('Écrivez une suggestion.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await pmsPost(token, 'suggestions', { message: draft.trim() });
      setDraft('');
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function decide(id: number, status: 'approuvee' | 'refusee') {
    if (!token) return;
    await pmsPost(token, 'suggestions/decide', { id, status });
    await reload();
  }

  if (ready && !user) return <Redirect href="/welcome" />;

  return (
    <HotelShell title="Suggestions" loading={loading && !data} error={error}>
      {isOwner ? (
        <FilterBar
          query={query}
          onQuery={setQuery}
          queryPlaceholder="Rechercher une suggestion..."
          status={filter}
          onStatus={setFilter}
          statuses={[
            { id: 'all', label: 'Toutes' },
            { id: 'ouverte', label: 'En attente' },
            { id: 'approuvee', label: 'Approuvées' },
            { id: 'refusee', label: 'Refusées' },
          ]}
        />
      ) : (
        <View style={styles.compose}>
          <View style={styles.topLine}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Proposez une amélioration…"
              style={styles.lineInput}
            />
            <GoldBtn compact icon="bulb" label={saving ? 'Envoi…' : 'Envoyer'} onPress={() => void send()} />
          </View>
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        </View>
      )}
      <View style={styles.list}>
        {visible.map((item) => (
          <View key={item.id} style={[styles.card, { width: cardWidth }]}>
            <View style={styles.iconBox}>
              <AppIcon name="bulb" size={18} color={Palette.ink} />
            </View>
            <View style={styles.copy}>
              <View style={styles.head}>
                <Text style={styles.author}>{isOwner ? item.author : 'Votre suggestion'}</Text>
                <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
              </View>
              <Text style={styles.body}>{item.message}</Text>
              <Text style={styles.meta}>{prettyStamp(item.created_at)}</Text>
              {item.status === 'ouverte' && isOwner ? (
                <View style={styles.actions}>
                  <GoldBtn tiny icon="check-circle" label="Approuver" onPress={() => void decide(item.id, 'approuvee')} />
                  <GoldBtn tiny icon="x-circle" label="Refuser" variant="ink" onPress={() => void decide(item.id, 'refusee')} />
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      {!visible.length ? (
        <Text style={styles.empty}>
          {!items.length && !isOwner
            ? 'Vous n’avez pas encore envoyé de suggestion.'
            : 'Aucune suggestion dans ce filtre.'}
        </Text>
      ) : null}
    </HotelShell>
  );
}

const styles = StyleSheet.create({
  compose: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  topLine: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 8,
  },
  lineInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Palette.ink,
    height: 40,
  },
  formError: { color: Palette.ink, fontWeight: '700', backgroundColor: 'rgba(212,175,55,0.18)', padding: 10, borderRadius: 12 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  author: { color: Palette.ink, fontWeight: '800', fontSize: 16, flex: 1 },
  body: { color: Palette.ink, fontSize: 14, lineHeight: 20 },
  meta: { color: Palette.ink, opacity: 0.55, fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, marginTop: 8 },
  empty: { color: Palette.ink, opacity: 0.6 },
});
