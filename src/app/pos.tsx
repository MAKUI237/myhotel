import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Text, TextInput, View } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { money } from '@/lib/format';
import { printReceipt } from '@/lib/print';

type Pos = {
  outlets: Array<{ name: string; type: string; warehouse: string; seats: number }>;
  sellers: Array<{ name: string; outlet: string }>;
  sales: Array<{
    outlet: string;
    seller: string;
    guest_name: string | null;
    room_number: string | null;
    total: number;
    at: string;
    item?: string;
  }>;
  menu: Array<{ name: string; price: number; category: string }>;
};

export default function PosScreen() {
  const { data, error, loading, reload, token, user, ready } = usePms<Pos>('pos');
  const [tab, setTab] = useState('caisse');
  const [item, setItem] = useState('Café MyHotel');
  const [amount, setAmount] = useState('2000');
  const [guest, setGuest] = useState('Claire Dubois');
  const [room, setRoom] = useState('102');
  if (ready && !user) return <Redirect href="/welcome" />;
  const seller = user?.full_name || 'Caisse';

  async function sell() {
    if (!token) return;
    try {
      await pmsPost(token, 'pos/sale', {
        outlet: 'Restaurant Le Palmier',
        seller,
        item,
        total: Number(amount),
        guest_name: guest,
        room_number: room,
      });
      await reload();
      printReceipt({
        title: 'Reçu de vente',
        actor: seller,
        total: money(Number(amount)),
        rows: [
          ['Article', item],
          ['Client', guest || 'Comptoir'],
          ['Chambre', room || '—'],
          ['Vendeur', seller],
          ['Montant', money(Number(amount))],
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      if (Platform.OS === 'web') globalThis.alert(message);
      else Alert.alert(message);
    }
  }

  return (
    <HotelShell
      title="Points de vente"
      subtitle="Chaque vente est au nom du vendeur connecté — reçus imprimables, FCFA"
      loading={loading}
      error={error}>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'caisse', label: 'Caisse' },
          { id: 'points', label: 'Points de vente' },
          { id: 'ventes', label: 'Ventes' },
        ]}
      />
      {tab === 'caisse' ? (
        <Panel>
          <Text style={{ color: Palette.ink, fontWeight: '800' }}>Vente · {seller}</Text>
          <TextInput value={item} onChangeText={setItem} placeholder="Article" style={input} />
          <TextInput value={amount} onChangeText={setAmount} placeholder="Montant FCFA" keyboardType="numeric" style={input} />
          <TextInput value={guest} onChangeText={setGuest} placeholder="Client en chambre (optionnel)" style={input} />
          <TextInput value={room} onChangeText={setRoom} placeholder="N° chambre" style={input} />
          <GoldBtn label="Encaisser et imprimer le reçu" onPress={() => void sell()} />
          <View style={{ gap: 6 }}>
            {data?.menu.slice(0, 6).map((m) => (
              <Text key={m.name} style={{ color: Palette.ink }}>
                {m.category} · {m.name} · {money(m.price)}
              </Text>
            ))}
          </View>
        </Panel>
      ) : null}
      {tab === 'points'
        ? data?.outlets.map((o) => (
            <Panel key={o.name}>
              <Line icon="restaurant" title={o.name} meta={`${o.type} · magasin ${o.warehouse} · ${o.seats} places`} />
              {data.sellers
                .filter((s) => s.outlet === o.name)
                .map((s) => (
                  <Text key={s.name} style={{ color: Palette.ink, opacity: 0.7 }}>
                    Vendeur : {s.name}
                  </Text>
                ))}
            </Panel>
          ))
        : null}
      {tab === 'ventes'
        ? data?.sales.map((s) => (
            <Panel key={s.at + s.total + s.seller}>
              <Line
                icon="receipt"
                title={`${s.outlet} · ${money(s.total)}`}
                meta={`${s.seller} · ${s.at}${s.guest_name ? ` · ${s.guest_name} ch.${s.room_number}` : ' · comptoir'}`}
                right={s.room_number ? <StatusBadge label="Folio chambre" tone="gold" /> : null}
              />
              <GoldBtn
                label="Imprimer le reçu"
                onPress={() =>
                  printReceipt({
                    title: 'Reçu de vente',
                    actor: s.seller,
                    total: money(s.total),
                    rows: [
                      ['Point de vente', s.outlet],
                      ['Client', s.guest_name || 'Comptoir'],
                      ['Chambre', s.room_number || '—'],
                      ['Vendeur', s.seller],
                      ['Date', s.at],
                    ],
                  })
                }
              />
            </Panel>
          ))
        : null}
    </HotelShell>
  );
}

const input = {
  borderWidth: 1,
  borderColor: Palette.ink,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: Palette.ink,
};
