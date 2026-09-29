import { Platform } from 'react-native';
import { Image } from 'expo-image';
import { createElement } from 'react';

import { Radius } from '@/constants/theme';

export function RoomMedia({
  photo,
  video,
  height = 240,
}: {
  photo: string;
  video?: string | null;
  height?: number;
}) {
  if (video && Platform.OS === 'web') {
    return createElement('video', {
      src: video,
      poster: photo,
      controls: true,
      playsInline: true,
      preload: 'metadata',
      style: {
        width: '100%',
        height,
        objectFit: 'cover',
        borderRadius: Radius.card,
        background: '#141622',
        display: 'block',
      },
    });
  }
  return <Image source={{ uri: photo }} style={{ width: '100%', height, borderRadius: Radius.card }} contentFit="cover" />;
}
