import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthShell } from '@/components/auth/auth-shell';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register, user, ready } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (ready && user) {
    return <Redirect href="/home" />;
  }

  async function onSubmit() {
    setError(null);
    const name = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (name.length < 2) {
      setError('Indiquez votre nom complet.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Adresse e-mail invalide.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: name,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
        password,
      });
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Text style={styles.title}>Inscription</Text>
      <Text style={styles.subtitle}>Créez votre compte pour réserver et gérer vos séjours</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AuthField
        icon="person"
        placeholder="Nom complet"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        editable={!loading}
      />
      <AuthField
        icon="mail"
        placeholder="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!loading}
      />
      <AuthField
        icon="phone"
        placeholder="Téléphone (optionnel)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        editable={!loading}
      />
      <AuthField
        icon="lock"
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password-new"
        textContentType="newPassword"
        editable={!loading}
      />
      <AuthField
        icon="lock"
        placeholder="Confirmer le mot de passe"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="password-new"
        textContentType="newPassword"
        editable={!loading}
      />

      <AuthButton label="Créer mon compte" loading={loading} onPress={onSubmit} />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Déjà un compte ? </Text>
        <Pressable onPress={() => router.push('/login')} disabled={loading}>
          <Text style={styles.switchLink}>Se connecter</Text>
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
