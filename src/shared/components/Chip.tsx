import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  /** Nombre del lector cuando el texto visible no alcanza (un "Sí" o un "< 5 h"). */
  accessibilityLabel?: string;
};

export function Chip({ label, selected, onPress, accessibilityHint, accessibilityLabel }: ChipProps) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? palette.primarySoft : palette.surface,
          borderColor: selected ? palette.primary : palette.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? palette.textPrimary : palette.text, fontWeight: selected ? '700' : '600' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontSize: 15 },
});
