import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

export function BetaBanner() {
  const { palette } = useTheme();
  return (
    <View
      style={[styles.wrap, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}
      accessibilityRole="text"
    >
      <Text style={[styles.text, { color: palette.primary }]}>
        BETA · datos de demostración
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
});
