import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { HotelShell } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { money } from '@/lib/format';
import { downloadReport, printHtml } from '@/lib/print';

type Reports = {
  kpis: { allRevenue: number; roomRevenue: number; posRevenue: number; costs: number };
  salesByOutlet: Array<{ outlet: string; n: number; amount: number }>;
  loyal: Array<{ full_name: string; loyalty_nights: number; nationality: string; vip: number }>;
  topProducts: Array<{ product_name: string; qty: number; amount: number }>;
  reservations: Array<{ guest_name: string; room_number: string; check_in: string; status: string }>;
};

export default function ReportsScreen() {
  const { data, error, loading, user, ready } = usePms<Reports>('reports');
  const [tab, setTab] = useState('ca');
  if (ready && !user) return <Redirect href="/welcome" />;

  function body() {
    if (!data) return '';
    return `
      <p class="gold">CA global ${money(data.kpis.allRevenue)}</p>
      <table>
        <tr><th>Hébergement</th><td>${money(data.kpis.roomRevenue)}</td></tr>
        <tr><th>Ventes</th><td>${money(data.kpis.posRevenue)}</td></tr>
        <tr><th>Charges</th><td>${money(data.kpis.costs)}</td></tr>
      </table>
      <h1>Points de vente</h1>
      <table>${data.salesByOutlet.map((o) => `<tr><th>${o.outlet}</th><td>${o.n} tickets · ${money(o.amount)}</td></tr>`).join('')}</table>
    `;
  }

  return (
    <HotelShell title="États & statistiques" subtitle="Imprimer ou télécharger le rapport (PDF via impression)" loading={loading} error={error}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <GoldBtn label="Imprimer le rapport" onPress={() => printHtml('Rapport de gestion MyHotel', body())} />
        <GoldBtn
          label="Télécharger PDF"
          onPress={() => downloadReport('rapport-myhotel.pdf', 'Rapport de gestion MyHotel', body())}
        />
      </View>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'ca', label: 'Chiffre d’affaires' },
          { id: 'fideles', label: 'Clients fidèles' },
          { id: 'produits', label: 'Produits' },
          { id: 'resa', label: 'Historique résa' },
        ]}
      />
      {tab === 'ca' && data ? (
        <>
          <Panel>
            <Line icon="bar-chart-alt-2" title={`CA global ${money(data.kpis.allRevenue)}`} meta={`Hébergement ${money(data.kpis.roomRevenue)} · Ventes ${money(data.kpis.posRevenue)} · Charges ${money(data.kpis.costs)}`} />
          </Panel>
          {data.salesByOutlet.map((o) => (
            <Panel key={o.outlet}>
              <Line icon="restaurant" title={o.outlet} meta={`${o.n} tickets`} right={<Text style={{ color: Palette.gold, fontWeight: '800' }}>{money(o.amount)}</Text>} />
            </Panel>
          ))}
        </>
      ) : null}
      {tab === 'fideles'
        ? data?.loyal.map((g) => (
            <Panel key={g.full_name}>
              <Line icon="star" title={`${g.full_name}${g.vip ? ' · VIP' : ''}`} meta={`${g.loyalty_nights} nuitées · ${g.nationality}`} />
            </Panel>
          ))
        : null}
      {tab === 'produits'
        ? data?.topProducts.map((p) => (
            <Panel key={p.product_name}>
              <Line icon="food-menu" title={p.product_name} meta={`Qté ${p.qty}`} right={<Text style={{ color: Palette.gold, fontWeight: '800' }}>{money(p.amount)}</Text>} />
            </Panel>
          ))
        : null}
      {tab === 'resa'
        ? data?.reservations.map((r) => (
            <Panel key={r.guest_name + r.check_in}>
              <Line icon="calendar" title={`${r.guest_name} · ch. ${r.room_number}`} meta={`${r.check_in} · ${r.status}`} />
            </Panel>
          ))
        : null}
    </HotelShell>
  );
}
