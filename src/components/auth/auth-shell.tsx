import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { BrandMark } from '@/components/brand/brand-mark';
import { Brand } from '@/constants/config';
import { Breakpoints, Palette, Radius } from '@/constants/theme';

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;

  if (isDesktop) {
    return (
      <View style={styles.canvas}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            <View style={styles.brandPane}>
              <View style={[styles.tab, styles.tabTop]} />
              <View style={[styles.tab, styles.tabBottom]} />
              <BrandMark size={108} />
              <Text style={styles.brandName}>{Brand.name}</Text>
            </View>
            <ScrollView
              style={styles.formPane}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.mobileCanvas}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.mobileHeader} edges={['top']}>
        <View style={styles.mobileTab} />
        <BrandMark size={84} />
        <Text style={styles.mobileBrand}>{Brand.name}</Text>
      </SafeAreaView>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.mobileForm}
          contentContainerStyle={styles.mobileFormContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  kav: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  card: {
    width: 860,
    height: 540,
    maxWidth: '92%',
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.gold,
    ...Platform.select({
      web: { boxShadow: '0 28px 70px rgba(20, 22, 34, 0.45)' },
      ios: {
        shadowColor: Palette.ink,
        shadowOpacity: 0.35,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 18 },
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  brandPane: {
    width: 300,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    position: 'relative',
  },
  tab: {
    position: 'absolute',
    width: 22,
    height: 48,
    right: -11,
    backgroundColor: Palette.gold,
    borderRadius: 12,
    zIndex: 2,
  },
  tabTop: {
    top: 42,
  },
  tabBottom: {
    bottom: 42,
  },
  brandName: {
    color: Palette.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  formPane: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Palette.white,
  },
  formContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 14,
    width: '100%',
  },
  mobileCanvas: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  mobileHeader: {
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 12,
    position: 'relative',
  },
  mobileTab: {
    position: 'absolute',
    width: 48,
    height: 18,
    backgroundColor: Palette.gold,
    borderRadius: 12,
    bottom: -9,
    alignSelf: 'center',
  },
  mobileBrand: {
    color: Palette.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  mobileForm: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  mobileFormContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 14,
  },
});
