import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';
import { money } from '@/lib/format';

type Stock = {
  warehouses: Array<{ name: string; kind: string }>;
  products: Array<{
    id: number;
    name: string;
    category: string;
    stock: number;
    min_stock: number;
    unit: string;
    warehouse: string;
    price?: number;
  }>;
  moves: Array<{ product_name: string; warehouse: string; type: string; qty: number; at: string; dest: string | null }>;
  inventories: Array<{ warehouse: string; at: string; counted_by: string; variance: number; status: string }>;
};

export default function StockScreen() {
  const { data, error, loading, reload, token, user, ready } = usePms<Stock>('stock');
  const [tab, setTab] = useState('etat');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Divers');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  if (ready && !user) return <Redirect href="/welcome" />;
  const canEdit = user?.role === 'manager' || user?.role === 'owner';

  return (
    <HotelShell title="Articles & stock" subtitle="Ajouter ou retirer un produit — prix en FCFA" loading={loading} error={error}>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'etat', label: 'État des stocks' },
          { id: 'mouvements', label: 'Mouvements' },
          { id: 'inventaires', label: 'Inventaires' },
        ]}
      />
      {tab === 'etat' && canEdit ? (
        <Panel>
          <Text style={{ color: Palette.ink, fontWeight: '800' }}>Nouvel article</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Nom" style={input} />
          <TextInput value={category} onChangeText={setCategory} placeholder="Catégorie" style={input} />
          <TextInput value={price} onChangeText={setPrice} placeholder="Prix FCFA" keyboardType="numeric" style={input} />
          <TextInput value={stock} onChangeText={setStock} placeholder="Stock initial" keyboardType="numeric" style={input} />
          <GoldBtn
            label="Ajouter l’article"
            onPress={() =>
              token
                ? void pmsPost(token, 'products', {
                    name,
                    category,
                    price: Number(price),
                    stock: Number(stock),
                  }).then(() => {
                    setName('');
                    return reload();
                  })
                : undefined
            }
          />
        </Panel>
      ) : null}
      {tab === 'etat'
        ? data?.products.map((p) => (
            <Panel key={p.id || p.name}>
              <Line
                icon="cabinet"
                title={`${p.name} · ${p.stock} ${p.unit}`}
                meta={`${p.warehouse} · ${p.category}${p.price != null ? ` · ${money(p.price)}` : ''} · seuil ${p.min_stock}`}
                right={
                  <StatusBadge
                    label={p.stock <= p.min_stock ? 'Sous seuil' : 'OK'}
                    tone={p.stock <= p.min_stock ? 'ink' : 'gold'}
                  />
                }
              />
              {canEdit && token ? (
                <GoldBtn label="Supprimer" onPress={() => void pmsPost(token, 'products/delete', { id: p.id }).then(reload)} />
              ) : null}
            </Panel>
          ))
        : null}
      {tab === 'mouvements'
        ? data?.moves.map((m) => (
            <Panel key={m.at + m.product_name}>
              <Line
                icon="door-open"
                title={`${m.type} · ${m.product_name} x${m.qty}`}
                meta={`${m.warehouse}${m.dest ? ` → ${m.dest}` : ''} · ${m.at}`}
              />
            </Panel>
          ))
        : null}
      {tab === 'inventaires'
        ? data?.inventories.map((i) => (
            <Panel key={i.at + i.warehouse}>
              <Line icon="check-circle" title={i.warehouse} meta={`${i.at} · ${i.counted_by} · écart ${i.variance}`} />
            </Panel>
          ))
        : null}
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
