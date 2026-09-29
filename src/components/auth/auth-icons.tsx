import { AppIcon } from '@/components/box-icon';
import { Palette } from '@/constants/theme';

export type AuthIconName = 'person' | 'lock' | 'mail' | 'phone' | 'eye' | 'eye-off';

const map = {
  person: 'user',
  lock: 'lock-alt',
  mail: 'envelope',
  phone: 'phone',
  eye: 'show',
  'eye-off': 'hide',
} as const;

export function AuthIcon({ name, color = Palette.ink }: { name: AuthIconName; color?: string }) {
  return <AppIcon name={map[name]} size={22} color={color} />;
}
