import { Redirect } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { HotelShell } from '@/components/hotel/hotel-shell';
import { GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';

type Data = {
  shifts: Array<{ id: number; staff_name: string; day: string; start_hour: string; end_hour: string; task: string }>;
  staff: Array<{ full_name: string; role: string }>;
};

export default function ScheduleScreen() {
  const { user, ready } = useAuth();
  const { data, error, loading, reload, token } = usePms<Data>('workspace');
  const [name, setName] = useState('Amina Koffi');
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('16:00');
  const [task, setTask] = useState('');
  if (ready && !user) return <Redirect href="/welcome" />;

  return (
    <HotelShell title="Planning" subtitle="Heures de service et tâches" loading={loading} error={error}>
      <Panel>
        <TextInput value={name} onChangeText={setName} placeholder="Employé" style={input} />
        <TextInput value={day} onChangeText={setDay} placeholder="Jour" style={input} />
        <TextInput value={start} onChangeText={setStart} placeholder="Début" style={input} />
        <TextInput value={end} onChangeText={setEnd} placeholder="Fin" style={input} />
        <TextInput value={task} onChangeText={setTask} placeholder="Tâche" style={input} />
        <GoldBtn
          label="Planifier"
          onPress={() =>
            void pmsPost(token || '', 'shifts', {
              staff_name: name,
              day,
              start_hour: start,
              end_hour: end,
              task,
            }).then(reload)
          }
        />
      </Panel>
      {data?.shifts.map((s) => (
        <Panel key={s.id}>
          <Line icon="time" title={`${s.staff_name} · ${s.day}`} meta={`${s.start_hour}–${s.end_hour} · ${s.task || 'Service'}`} />
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
