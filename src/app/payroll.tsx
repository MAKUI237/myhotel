import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { Chips, GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { usePms } from '@/hooks/use-pms';
import { money } from '@/lib/format';
import { printHtml, printReceipt } from '@/lib/print';

type Pay = {
  staff: Array<{
    id: number;
    full_name: string;
    role: string;
    department?: string;
    contract_type: string;
    salary_type: string;
    salary_amount: number;
    union_name: string | null;
    mutual_name?: string | null;
    cnps_number: string | null;
    id_number?: string | null;
    hired_at?: string;
    iban?: string | null;
    departure_type: string | null;
    status: string;
  }>;
  timesheets: Array<{ staff_id: number; day: string; present: number; overtime_hours: number }>;
  sanctions: Array<{ full_name: string; type: string; at: string; note: string }>;
  advances: Array<{ full_name: string; kind: string; amount: number; at: string }>;
  payslips: Array<{
    full_name: string;
    role: string;
    department?: string;
    period: string;
    gross: number;
    overtime: number;
    indemnities?: number;
    irpp: number;
    cac: number;
    cfc: number;
    rav: number;
    tdl: number;
    cnps_employee: number;
    cnps_employer: number;
    advances: number;
    net: number;
    status: string;
    iban?: string | null;
  }>;
  indemnities?: Array<{ full_name: string; kind: string; amount: number; at: string; note: string }>;
  by_department?: Array<{ department: string; n: number; gross: number; net: number }>;
  virements?: Array<{ full_name: string; iban: string; salary_amount: number }>;
  mass?: number;
};

const KIND_LABEL: Record<string, string> = {
  conges: 'Congés',
  preavis: 'Préavis',
  chomage_technique: 'Chômage technique',
  licenciement: 'Licenciement',
  acompte: 'Acompte',
  avance: 'Avance sur salaire',
};

export default function PayrollScreen() {
  const { data, error, loading, user, ready } = usePms<Pay>('payroll');
  const [tab, setTab] = useState('personnel');
  if (ready && !user) return <Redirect href="/welcome" />;
  const mass = data?.mass ?? data?.payslips.reduce((s, p) => s + p.net, 0) ?? 0;

  return (
    <HotelShell title="Gestion de la paie" subtitle="Identification, contrats, bulletins, états et cotisations — FCFA" loading={loading} error={error}>
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: 'personnel', label: 'Personnel' },
          { id: 'pointage', label: 'HS / Pointage' },
          { id: 'bulletins', label: 'Bulletins' },
          { id: 'avances', label: 'Acomptes' },
          { id: 'indemnites', label: 'Indemnités' },
          { id: 'etats', label: 'États' },
          { id: 'cotisations', label: 'Cotisations' },
          { id: 'sanctions', label: 'Sanctions' },
        ]}
      />
      {tab === 'personnel'
        ? data?.staff.map((s) => (
            <Panel key={s.id}>
              <Line
                icon="id-card"
                title={s.full_name}
                meta={`${s.role} · ${s.department || ''} · arrivée ${s.hired_at || '—'} · ${s.id_number || 'ID —'}`}
                right={<StatusBadge label={s.status} tone={s.status === 'actif' ? 'gold' : 'muted'} />}
              />
              <Text style={{ color: Palette.ink }}>
                Contrat {s.contract_type} · Salaire {s.salary_type} {money(s.salary_amount)}
              </Text>
              {s.iban ? <Text style={{ color: Palette.ink, opacity: 0.7 }}>Virement {s.iban}</Text> : null}
              {s.union_name ? <Text style={{ color: Palette.ink }}>Syndicat {s.union_name}</Text> : null}
              {s.mutual_name ? <Text style={{ color: Palette.ink }}>Mutuelle {s.mutual_name}</Text> : null}
              {s.departure_type ? <Text style={{ color: Palette.ink }}>Départ : {s.departure_type}</Text> : null}
            </Panel>
          ))
        : null}
      {tab === 'pointage'
        ? data?.timesheets.slice(0, 16).map((t) => (
            <Panel key={t.staff_id + t.day}>
              <Line icon="time" title={`Agent #${t.staff_id} · ${t.day}`} meta={t.present ? `Présent · HS ${t.overtime_hours} h` : 'Absence'} />
            </Panel>
          ))
        : null}
      {tab === 'bulletins' ? (
        <>
          <Panel>
            <Line icon="money" title={`Masse salariale nette ${money(mass)}`} meta="Période 2026-09 · IRPP, CAC, CFC, RAV, TDL, CNPS" />
          </Panel>
          {data?.payslips.map((p) => (
            <Panel key={p.full_name}>
              <Line icon="receipt" title={`${p.full_name} · net ${money(p.net)}`} meta={`${p.role} · brut ${money(p.gross)} · HS ${money(p.overtime)}`} />
              <Text style={{ color: Palette.ink, fontSize: 12, opacity: 0.75 }}>
                IRPP {money(p.irpp)} · CAC {money(p.cac)} · CFC {money(p.cfc)} · RAV {money(p.rav)} · TDL {money(p.tdl)} ·
                CNPS sal. {money(p.cnps_employee)} / pat. {money(p.cnps_employer)} · avances {money(p.advances)}
              </Text>
              <GoldBtn
                label="Imprimer le bulletin"
                onPress={() =>
                  printReceipt({
                    title: `Bulletin de paie · ${p.full_name}`,
                    total: `Net à payer ${money(p.net)}`,
                    rows: [
                      ['Période', p.period],
                      ['Poste', p.role],
                      ['Brut', money(p.gross)],
                      ['Heures sup.', money(p.overtime)],
                      ['Indemnités', money(p.indemnities || 0)],
                      ['Avances / acomptes', money(p.advances)],
                      ['CNPS salarié', money(p.cnps_employee)],
                    ],
                  })
                }
              />
            </Panel>
          ))}
        </>
      ) : null}
      {tab === 'avances'
        ? data?.advances.map((a) => (
            <Panel key={a.full_name + a.at}>
              <Line
                icon="wallet"
                title={`${a.full_name} · ${KIND_LABEL[a.kind] || a.kind}`}
                meta={a.at}
                right={<Text style={{ color: Palette.gold, fontWeight: '800' }}>{money(a.amount)}</Text>}
              />
            </Panel>
          ))
        : null}
      {tab === 'indemnites'
        ? data?.indemnities?.map((i) => (
            <Panel key={i.full_name + i.at + i.kind}>
              <Line
                icon="briefcase"
                title={`${i.full_name} · ${KIND_LABEL[i.kind] || i.kind}`}
                meta={`${i.at} · ${i.note}`}
                right={<Text style={{ color: Palette.gold, fontWeight: '800' }}>{money(i.amount)}</Text>}
              />
            </Panel>
          ))
        : null}
      {tab === 'etats' && data ? (
        <>
          <Panel>
            <Line icon="bar-chart-alt-2" title={`État global · ${money(mass)}`} meta={`${data.payslips.length} bulletins`} />
            <GoldBtn
              label="Imprimer l’état des salaires"
              onPress={() =>
                printHtml(
                  'État des salaires',
                  `<table>${data.payslips.map((p) => `<tr><th>${p.full_name}</th><td>${p.department || ''} · net ${money(p.net)}</td></tr>`).join('')}</table>
                   <p class="total">Masse ${money(mass)}</p>`,
                )
              }
            />
          </Panel>
          <Panel>
            <Text style={{ color: Palette.ink, fontWeight: '800' }}>Virements</Text>
            {data.virements?.map((v) => (
              <Text key={v.full_name} style={{ color: Palette.ink }}>
                {v.full_name} · {v.iban} · {money(v.salary_amount)}
              </Text>
            ))}
          </Panel>
          {data.by_department?.map((d) => (
            <Panel key={d.department}>
              <Line icon="building" title={d.department} meta={`${d.n} salariés · brut ${money(d.gross)}`} right={<Text style={{ color: Palette.gold, fontWeight: '800' }}>{money(d.net)}</Text>} />
            </Panel>
          ))}
        </>
      ) : null}
      {tab === 'cotisations'
        ? data?.staff
            .filter((s) => s.union_name || s.mutual_name)
            .map((s) => (
              <Panel key={s.id}>
                <Line
                  icon="group"
                  title={s.full_name}
                  meta={[s.union_name && `Syndicat ${s.union_name}`, s.mutual_name && `Mutuelle ${s.mutual_name}`, s.cnps_number && `CNPS ${s.cnps_number}`]
                    .filter(Boolean)
                    .join(' · ')}
                />
              </Panel>
            ))
        : null}
      {tab === 'sanctions'
        ? data?.sanctions.map((s) => (
            <Panel key={s.full_name + s.at}>
              <Line icon="error-circle" title={`${s.full_name} · ${s.type}`} meta={`${s.at} · ${s.note}`} />
            </Panel>
          ))
        : null}
    </HotelShell>
  );
}
