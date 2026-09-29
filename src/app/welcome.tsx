import { StatusBar } from 'expo-status-bar';
import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { BrandMark } from '@/components/brand/brand-mark';
import { Brand } from '@/constants/config';
import { Breakpoints, Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;

  if (ready && user) {
    return <Redirect href="/home" />;
  }

  const content = (
    <View style={[styles.panel, isDesktop && styles.panelDesktop]}>
      <Text style={styles.hello}>Bonjour, bienvenue !</Text>
      <Text style={styles.brand}>{Brand.name}</Text>
      <View style={styles.logoWrap}>
        <BrandMark size={isDesktop ? 128 : 108} />
      </View>
      <View style={styles.actions}>
        <AuthButton label="S’inscrire" variant="ink" onPress={() => router.push('/register')} />
        <AuthButton label="Se connecter" variant="outline" onPress={() => router.push('/login')} />
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopCanvas}>
        <StatusBar style="light" />
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mobile} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  desktopCanvas: {
    flex: 1,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mobile: {
    flex: 1,
    backgroundColor: Palette.gold,
  },
  panel: {
    flex: 1,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  panelDesktop: {
    flex: 0,
    width: 560,
    minHeight: 640,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.gold,
    overflow: 'hidden',
  },
  hello: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  brand: {
    color: Palette.ink,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.4,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
    paddingBottom: 8,
  },
});
