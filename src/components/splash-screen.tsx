import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import { BrandMark } from '@/components/brand/brand-mark';
import { Brand } from '@/constants/config';
import { Palette } from '@/constants/theme';

type SplashViewProps = {
  onFinished: () => void;
  duration?: number;
};

export function SplashView({ onFinished, duration = 2400 }: SplashViewProps) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    const timer = setTimeout(onFinished, duration);
    return () => clearTimeout(timer);
  }, [duration, onFinished]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View entering={ZoomIn.duration(700)} style={styles.logoWrap}>
        <View style={styles.goldRing}>
          <BrandMark size={128} />
        </View>
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(280).duration(600)} style={styles.title}>
        {Brand.name}
      </Animated.Text>
      <Animated.View entering={FadeIn.delay(500).duration(500)} style={styles.rule} />
      <Animated.Text entering={FadeIn.delay(720).duration(500)} style={styles.tagline}>
        {Brand.tagline}
      </Animated.Text>
      <Text style={styles.hint}>iOS · Android · Desktop</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    marginBottom: 22,
  },
  goldRing: {
    padding: 4,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Palette.gold,
  },
  title: {
    color: Palette.gold,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rule: {
    width: 72,
    height: 2,
    backgroundColor: Palette.gold,
    marginVertical: 14,
  },
  tagline: {
    color: Palette.white,
    fontSize: 16,
    opacity: 0.92,
    textAlign: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: 36,
    color: Palette.gold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
