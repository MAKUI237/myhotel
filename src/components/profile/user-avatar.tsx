import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

export function initialsFromName(name?: string | null) {
  return (name || 'U')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserAvatar({
  name,
  photo,
  size = 36,
}: {
  name?: string | null;
  photo?: string | null;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.image} contentFit="cover" />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initialsFromName(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: Palette.gold,
    fontWeight: '800',
  },
});
