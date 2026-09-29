import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { HotelShell, StatusBadge } from '@/components/hotel/hotel-shell';
import { GoldBtn, Line, Panel } from '@/components/hotel/kit';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePms } from '@/hooks/use-pms';
import { pmsPost } from '@/lib/api';

type Data = {
  suggestions: Array<{
    id: number;
    author: string;
    message: string;
    reply: string | null;
    status: string;
    created_at: string;
  }>;
};

export default function SuggestionsScreen() {
  const { user, ready } = useAuth();
  const { data, error, loading, reload, token } = usePms<Data>('workspace');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const canReply = user?.role === 'manager' || user?.role === 'owner';
  if (ready && !user) return <Redirect href="/welcome" />;

  return (
    <HotelShell title="Suggestions" subtitle="Propositions du personnel et réponses de la gérance" loading={loading} error={error}>
      <Panel>
        <Text style={{ color: Palette.ink, fontWeight: '800' }}>Nouvelle suggestion</Text>
        <TextInput value={message} onChangeText={setMessage} placeholder="Votre proposition" style={input} multiline />
        <GoldBtn
          label="Envoyer"
          onPress={() =>
            void pmsPost(token || '', 'suggestions', {
              author: user?.full_name,
              role: user?.role,
              message,
            }).then(() => {
              setMessage('');
              return reload();
            })
          }
        />
      </Panel>
      {data?.suggestions.map((s) => (
        <Panel key={s.id}>
          <Line
            icon="bulb"
            title={s.author}
            meta={s.message}
            right={<StatusBadge label={s.status} tone={s.status === 'ouverte' ? 'gold' : 'muted'} />}
          />
          {s.reply ? <Text style={{ color: Palette.ink, marginTop: 6 }}>Réponse : {s.reply}</Text> : null}
          {canReply && s.status === 'ouverte' ? (
            <>
              <TextInput value={reply} onChangeText={setReply} placeholder="Répondre" style={input} />
              <GoldBtn
                label="Répondre"
                onPress={() =>
                  void pmsPost(token || '', 'suggestions/reply', { id: s.id, reply }).then(() => {
                    setReply('');
                    return reload();
                  })
                }
              />
            </>
          ) : null}
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
  minHeight: 44,
};
