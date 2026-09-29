import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Palette } from '@/constants/theme';

type Variant = 'gold' | 'ink' | 'outline' | 'ghost';

type AuthButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export function AuthButton({
  label,
  loading,
  variant = 'gold',
  disabled,
  style,
  ...rest
}: AuthButtonProps) {
  const isDisabled = disabled || loading;
  const labelColor = variant === 'gold' || variant === 'outline' || variant === 'ghost' ? Palette.ink : Palette.white;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    width: '100%',
  },
  gold: {
    backgroundColor: Palette.gold,
  },
  ink: {
    backgroundColor: Palette.ink,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Palette.ink,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.55,
  },
});
