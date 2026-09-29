import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/box-icon';
import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Breakpoints, Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { staffRequest, type StaffMember } from '@/lib/api';
import { staffStatusLabel } from '@/lib/format';

function tone(status: string): 'gold' | 'ink' | 'muted' {
  if (status === 'actif') return 'gold';
  if (status === 'conge') return 'ink';
  return 'muted';
}

export default function StaffScreen() {
  const { user, ready, token } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await staffRequest(token);
        if (!cancelled) setStaff(data);
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

  if (ready && !user) return <Redirect href="/welcome" />;

  const columns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const gutter = isDesktop ? 32 : 16;
  const max = Math.min(width, 1320);
  const cardWidth = Math.floor((max - gutter * 2 - (columns - 1) * 16) / columns);

  return (
    <HotelShell
      back
      title="Ressources humaines"
      subtitle="Personnel, postes et disponibilités"
      loading={loading}
      error={error}>
      <View style={styles.grid}>
        {staff.map((member) => (
          <View key={member.id} style={[styles.card, { width: cardWidth }]}>
            <Image source={{ uri: member.photo ?? undefined }} style={styles.photo} contentFit="cover" />
            <View style={styles.body}>
              <View style={styles.row}>
                <Text style={styles.name}>{member.full_name}</Text>
                <StatusBadge label={staffStatusLabel[member.status] ?? member.status} tone={tone(member.status)} />
              </View>
              <Text style={styles.role}>{member.role}</Text>
              <Text style={styles.dept}>{member.department}</Text>
              <View style={styles.line}>
                <AppIcon name="envelope" size={14} color={Palette.ink} />
                <Text style={styles.meta}>{member.email}</Text>
              </View>
              <View style={styles.line}>
                <AppIcon name="phone" size={14} color={Palette.ink} />
                <Text style={styles.meta}>{member.phone}</Text>
              </View>
              <Text style={styles.hired}>
                Embauché le {member.hired_at}
                {member.id_number ? ` · ${member.id_number}` : ''}
                {member.contract_type ? ` · ${member.contract_type}` : ''}
              </Text>
            </View>
          </View>
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
    height: 140,
    backgroundColor: Palette.ink,
  },
  body: {
    padding: 14,
    gap: 6,
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
    fontSize: 16,
    flex: 1,
  },
  role: {
    color: Palette.gold,
    fontWeight: '700',
  },
  dept: {
    color: Palette.ink,
    opacity: 0.7,
    fontSize: 13,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    color: Palette.ink,
    fontSize: 12,
    flex: 1,
  },
  hired: {
    color: Palette.ink,
    opacity: 0.55,
    fontSize: 12,
    marginTop: 4,
  },
});
