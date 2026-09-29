import '@/global.css';

import { Platform } from 'react-native';

/** Couleurs autorisées : or (primary), encre, blanc. */
export const Palette = {
  gold: '#D4AF37',
  ink: '#141622',
  white: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.white,
    backgroundElement: Palette.white,
    backgroundSelected: Palette.gold,
    textSecondary: Palette.ink,
    primary: Palette.gold,
  },
  dark: {
    text: Palette.white,
    background: Palette.ink,
    backgroundElement: Palette.ink,
    backgroundSelected: Palette.gold,
    textSecondary: Palette.white,
    primary: Palette.gold,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  input: 12,
  card: 28,
  button: 10,
  logo: 22,
} as const;

export const Breakpoints = {
  desktop: 880,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1040;
