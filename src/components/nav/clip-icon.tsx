import { Text } from 'react-native';

import { Palette } from '@/constants/theme';

/** Trombone type WhatsApp, indépendant de la police d’icônes. */
export function ClipIcon({ size = 22, color = Palette.ink }: { size?: number; color?: string }) {
  return (
    <Text
      accessibilityLabel="Joindre un fichier"
      style={{
        fontSize: size,
        lineHeight: size + 2,
        color,
        transform: [{ rotate: '-35deg' }],
      }}>
      📎
    </Text>
  );
}
