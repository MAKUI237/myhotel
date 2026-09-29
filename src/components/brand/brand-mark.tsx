import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';

type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 96 }: BrandMarkProps) {
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: size, height: size }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: Palette.ink,
  },
});
