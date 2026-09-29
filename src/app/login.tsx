import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthShell } from '@/components/auth/auth-shell';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, user, ready } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (ready && user) {
    return <Redirect href="/home" />;
  }

  async function onSubmit() {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Adresse e-mail invalide.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, password);
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.subtitle}>Entrez vos identifiants pour accéder à votre compte</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AuthField
        icon="person"
        placeholder="Entrez votre e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!loading}
      />
      <AuthField
        icon="lock"
        placeholder="Entrez votre mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        editable={!loading}
      />

      <Pressable
        onPress={() => {
          const title = 'Mot de passe oublié';
          const message = 'Contactez la réception de l’hôtel pour réinitialiser votre accès.';
          if (Platform.OS === 'web') {
            globalThis.alert(`${title}\n\n${message}`);
            return;
          }
          Alert.alert(title, message);
        }}>
        <Text style={styles.help}>Mot de passe oublié ?</Text>
      </Pressable>

      <AuthButton label="Se connecter" loading={loading} onPress={onSubmit} />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Pas encore de compte ? </Text>
        <Pressable onPress={() => router.push('/register')} disabled={loading}>
          <Text style={styles.switchLink}>S’inscrire</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: Palette.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Palette.ink,
    opacity: 0.7,
    fontSize: 15,
    marginBottom: 6,
  },
  help: {
    color: Palette.ink,
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 4,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: Palette.ink,
    borderRadius: 10,
    padding: 10,
    backgroundColor: Palette.white,
  },
  errorText: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  switchText: {
    color: Palette.ink,
    fontSize: 14,
  },
  switchLink: {
    color: Palette.gold,
    fontSize: 14,
    fontWeight: '800',
  },
});
