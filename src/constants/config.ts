import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const Brand = {
  name: 'MyHotel',
  tagline: 'L’élégance de votre séjour',
} as const;

export const ApiPort = 3847;

function resolveDevHost(): string {
  const explicit = process.env.EXPO_PUBLIC_API_HOST;
  if (explicit) return explicit;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname) return hostname === '127.0.0.1' ? 'localhost' : hostname;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const hostname = hostUri.replace(/^https?:\/\//, '').split(':')[0]?.split('/')[0];

  if (hostname && hostname !== '127.0.0.1') {
    if (hostname === 'localhost' && Platform.OS === 'android') {
      return '10.0.2.2';
    }
    return hostname;
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
  }
  return `http://${resolveDevHost()}:${ApiPort}`;
}
