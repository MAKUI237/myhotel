import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Platform,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { AuthIcon, type AuthIconName } from '@/components/auth/auth-icons';
import { Palette } from '@/constants/theme';

type AuthFieldProps = {
  icon: AuthIconName;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  editable?: boolean;
};

export function AuthField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  editable = true,
}: AuthFieldProps) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrap}>
      <AuthIcon name={icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(20, 22, 34, 0.45)"
        secureTextEntry={hidden}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        editable={editable}
        style={[styles.input, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as Record<string, string>) : null]}
      />
      {secureTextEntry ? (
        <Pressable onPress={() => setHidden((current) => !current)} hitSlop={10}>
          <AuthIcon name={hidden ? 'eye-off' : 'eye'} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 52,
    width: '100%',
    borderWidth: 1.5,
    borderColor: Palette.ink,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    gap: 10,
  },
  input: {
    flex: 1,
    color: Palette.ink,
    fontSize: 15,
    paddingVertical: 12,
    minWidth: 0,
  },
});
