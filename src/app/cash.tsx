import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { HotelShell } from '@/components/hotel/hotel-shell';
import { GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { money } from '@/lib/format';

type Data = {
  cash: Array<{ id: number; kind: string; label: string; amount: number; actor: string; at: string }>;
};

export default function CashScreen() {
  const { user, ready } = useAuth();
  const { data, error, loading, reload, token } = usePms<Data>('workspace');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'entree' | 'sortie'>('entree');
  if (ready && !user) return <Redirect href="/welcome" />;
  const inSum = data?.cash.filter((c) => c.kind === 'entree').reduce((s, c) => s + Number(c.amount), 0) ?? 0;
  const outSum = data?.cash.filter((c) => c.kind === 'sortie').reduce((s, c) => s + Number(c.amount), 0) ?? 0;

  return (
    <HotelShell title="Caisse" subtitle="Entrées et sorties d’argent (FCFA)" loading={loading} error={error}>
      <Panel>
        <Line icon="money" title={`Solde ${money(inSum - outSum)}`} meta={`Entrées ${money(inSum)} · Sorties ${money(outSum)}`} />
      </Panel>
      <Panel>
        <Text style={{ color: Palette.ink, fontWeight: '800' }}>Nouveau mouvement</Text>
        <TextInput value={label} onChangeText={setLabel} placeholder="Libellé" style={input} />
        <TextInput value={amount} onChangeText={setAmount} placeholder="Montant FCFA" keyboardType="numeric" style={input} />
        <GoldBtn label={kind === 'entree' ? 'Passer en sortie' : 'Passer en entrée'} onPress={() => setKind(kind === 'entree' ? 'sortie' : 'entree')} />
        <GoldBtn
          label={`Enregistrer ${kind === 'entree' ? 'l’entrée' : 'la sortie'}`}
          onPress={() =>
            void pmsPost(token || '', 'cash-moves', {
              kind,
              label,
              amount: Number(amount),
              actor: user?.full_name,
            }).then(reload)
          }
        />
      </Panel>
      {data?.cash.map((c) => (
        <Panel key={c.id}>
          <Line
            icon="wallet"
            title={`${c.kind === 'entree' ? 'Entrée' : 'Sortie'} · ${c.label}`}
            meta={`${c.actor} · ${c.at}`}
            right={<Text style={{ color: Palette.gold, fontWeight: '800' }}>{money(c.amount)}</Text>}
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
  marginTop: 8,
};
