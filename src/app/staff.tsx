import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { FilterBar, FilterSelect } from '@/components/hotel/filter-bar';
import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { ConfirmDialog, GoldBtn } from '@/components/hotel/kit';
import { ROLE_LABEL, type StaffRole } from '@/constants/roles';
import { Breakpoints, Palette, Radius } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { prettyStamp, staffStatusLabel } from '@/lib/format';

type Employee = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  photo?: string | null;
  last_login?: string | null;
  created_at?: string;
};

type Payload = { items: Employee[] };

type FormState = {
  id?: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
};

const ROLE_OPTIONS = [
  { id: 'receptionist', label: 'Réception' },
  { id: 'manager', label: 'Gérance' },
  { id: 'housekeeping', label: 'Entretien' },
];

const emptyForm: FormState = {
  full_name: '',
  email: '',
  phone: '',
  role: 'receptionist',
  password: '',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function statusTone(status: string): 'gold' | 'ink' | 'muted' {
  if (status === 'actif') return 'gold';
  if (status === 'banni') return 'ink';
  return 'muted';
}

export default function StaffScreen() {
  const { data, error, loading, reload, token, user, ready } = usePms<Payload>('employees');
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState<FormState | null>(null);
  const [pendingBan, setPendingBan] = useState<Employee | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isOwner = user?.role === 'owner';
  const isDesktop = width >= Breakpoints.desktop;
  const cols = width >= Breakpoints.tablet ? 3 : 1;
  const available = (isDesktop ? width - 248 : width) - 36;
  const cardWidth = Math.max(160, Math.floor((available - (cols - 1) * 12) / cols));
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const visible = useMemo(() => {
    return items.filter((item) => {
      const hay = `${item.full_name} ${item.email} ${item.phone ?? ''} ${item.role}`.toLowerCase();
      if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false;
      if (roleFilter !== 'all' && item.role !== roleFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, query, roleFilter, statusFilter]);

  async function save() {
    if (!token || !form || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        await pmsPost(token, 'employees/update', {
          id: form.id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          password: form.password,
        });
      } else {
        await pmsPost(token, 'employees', {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          password: form.password,
        });
      }
      setForm(null);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function applyBan() {
    if (!token || !pendingBan) return;
    const banned = pendingBan.status === 'banni';
    await pmsPost(token, banned ? 'employees/unban' : 'employees/ban', { id: pendingBan.id });
    setPendingBan(null);
    await reload();
  }

  if (ready && !user) return <Redirect href="/welcome" />;
  if (ready && !isOwner) return <Redirect href="/home" />;

  return (
    <HotelShell
      title="Personnel"
      loading={loading && !data}
      error={error}
      right={<GoldBtn compact icon="plus" label="Ajouter" onPress={() => { setFormError(null); setForm({ ...emptyForm }); }} />}>
      <FilterBar
        query={query}
        onQuery={setQuery}
        queryPlaceholder="Rechercher un employé..."
        category={roleFilter}
        onCategory={setRoleFilter}
        categories={[{ id: 'all', label: 'Tous les rôles' }, ...ROLE_OPTIONS]}
        status={statusFilter}
        onStatus={setStatusFilter}
        statuses={[
          { id: 'all', label: 'Tous' },
          { id: 'actif', label: 'Actifs' },
          { id: 'banni', label: 'Bannis' },
        ]}
      />
      <View style={styles.list}>
        {visible.map((item) => {
          const self = item.id === user?.id;
          const ownerRow = item.role === 'owner';
          return (
            <View key={item.id} style={[styles.card, { width: cardWidth }]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(item.full_name)}</Text>
              </View>
              <View style={styles.copy}>
                <View style={styles.head}>
                  <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
                  <StatusBadge label={staffStatusLabel[item.status] ?? item.status} tone={statusTone(item.status)} />
                </View>
                <Text style={styles.role}>{ROLE_LABEL[item.role as StaffRole] ?? item.role}</Text>
                <Text style={styles.meta} numberOfLines={1}>{item.email}</Text>
                {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
                <Text style={styles.meta}>
                  {item.last_login ? `Dernière connexion ${prettyStamp(item.last_login)}` : 'Jamais connecté'}
                </Text>
                {self || ownerRow ? (
                  <Text style={styles.hint}>{self ? 'Votre compte' : 'Compte propriétaire'}</Text>
                ) : (
                  <View style={styles.actions}>
                    <GoldBtn tiny icon="edit" label="Modifier" onPress={() => {
                      setFormError(null);
                      setForm({
                        id: item.id,
                        full_name: item.full_name,
                        email: item.email,
                        phone: item.phone || '',
                        role: item.role,
                        password: '',
                      });
                    }} />
                    <GoldBtn
                      tiny
                      icon={item.status === 'banni' ? 'show' : 'hide'}
                      label={item.status === 'banni' ? 'Réactiver' : 'Bannir'}
                      variant={item.status === 'banni' ? 'gold' : 'ink'}
                      onPress={() => setPendingBan(item)}
                    />
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
      {!visible.length ? <Text style={styles.empty}>Aucun employé ne correspond.</Text> : null}

      <ConfirmDialog
        visible={!!form}
        title={form?.id ? 'Modifier l’employé' : 'Nouvel employé'}
        message={form?.id ? 'Mettez à jour le rôle, les coordonnées ou le mot de passe.' : 'Créez un compte d’accès avec un rôle défini.'}
        confirmLabel={saving ? 'Enregistrement…' : form?.id ? 'Enregistrer' : 'Créer'}
        confirmIcon="check-circle"
        confirmVariant="gold"
        onCancel={() => { setForm(null); setFormError(null); }}
        onConfirm={() => void save()}>
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        {form ? (
          <View style={styles.fields}>
            <View style={styles.fieldWide}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput value={form.full_name} onChangeText={(full_name) => setForm({ ...form, full_name })} placeholder="Nom et prénom" style={styles.input} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={form.email}
                onChangeText={(email) => setForm({ ...form, email })}
                placeholder="employe@myhotel.test"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} placeholder="Optionnel" keyboardType="phone-pad" style={styles.input} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Rôle</Text>
              <FilterSelect value={form.role} onChange={(role) => setForm({ ...form, role })} options={ROLE_OPTIONS} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{form.id ? 'Nouveau mot de passe' : 'Mot de passe'}</Text>
              <TextInput
                value={form.password}
                onChangeText={(password) => setForm({ ...form, password })}
                placeholder={form.id ? 'Laisser vide pour conserver' : '8 caractères min.'}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        visible={!!pendingBan}
        title={pendingBan?.status === 'banni' ? 'Réactiver l’employé' : 'Bannir l’employé'}
        message={
          pendingBan?.status === 'banni'
            ? `Réactiver ${pendingBan?.full_name ?? ''} ? Il pourra à nouveau se connecter.`
            : `Bannir ${pendingBan?.full_name ?? ''} ? Il ne pourra plus se connecter.`
        }
        confirmLabel={pendingBan?.status === 'banni' ? 'Réactiver' : 'Bannir'}
        confirmIcon={pendingBan?.status === 'banni' ? 'check-circle' : 'hide'}
        confirmVariant={pendingBan?.status === 'banni' ? 'gold' : 'ink'}
        onCancel={() => setPendingBan(null)}
        onConfirm={() => void applyBan()}
      />
    </HotelShell>
  );
}

const styles = StyleSheet.create({
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: Palette.ink,
  },
  avatarText: { color: Palette.ink, fontWeight: '800', fontSize: 13 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { color: Palette.ink, fontWeight: '800', fontSize: 16, flex: 1 },
  role: { color: Palette.ink, fontWeight: '700', fontSize: 13 },
  meta: { color: Palette.ink, opacity: 0.55, fontSize: 12 },
  hint: { color: Palette.ink, opacity: 0.45, fontSize: 12, fontWeight: '700', marginTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, marginTop: 8 },
  empty: { color: Palette.ink, opacity: 0.6 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { minWidth: 140, flexGrow: 1, flexBasis: 140, gap: 6 },
  fieldWide: { minWidth: '100%', gap: 6 },
  label: { color: Palette.ink, fontWeight: '700', fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(20,22,34,0.14)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Palette.ink,
  },
  formError: { color: Palette.ink, fontWeight: '700', backgroundColor: 'rgba(212,175,55,0.18)', padding: 10, borderRadius: 12 },
});
