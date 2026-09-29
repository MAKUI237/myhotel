import { View } from 'react-native';

import { Palette } from '@/constants/theme';

export function Hamburger({ color = Palette.ink }: { color?: string }) {
  return (
    <View style={{ width: 20, height: 14, justifyContent: 'space-between' }}>
      <View style={{ height: 2.2, borderRadius: 99, backgroundColor: color }} />
      <View style={{ height: 2.2, width: 14, borderRadius: 99, backgroundColor: color }} />
      <View style={{ height: 2.2, borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}
