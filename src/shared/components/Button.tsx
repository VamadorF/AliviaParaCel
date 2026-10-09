import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  ...rest
}: ButtonProps) {
  const { palette } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? palette.primary : 'transparent',
          borderColor: palette.primary,
          opacity: pressed || disabled || loading ? 0.7 : 1,
        },
        !isPrimary && styles.ghost,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : palette.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isPrimary ? '#ffffff' : palette.primary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghost: {
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
