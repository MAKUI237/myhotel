import { View } from 'react-native';

import { Palette } from '@/constants/theme';

export function Hamburger({
  color = Palette.ink,
  size = 20,
}: {
  color?: string;
  size?: number;
}) {
  const bar = {
    height: 2.2,
    borderRadius: 99,
    backgroundColor: color,
    width: size,
  } as const;

  return (
    <View style={{ width: size, height: size * 0.72, justifyContent: 'space-between' }}>
      <View style={bar} />
      <View style={bar} />
      <View style={bar} />
    </View>
  );
}
