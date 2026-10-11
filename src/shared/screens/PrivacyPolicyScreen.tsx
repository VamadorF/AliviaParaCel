import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  PRIVACY_POLICY_DRAFT,
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_TITLE,
  PRIVACY_POLICY_VERSION,
} from '@/shared/data/privacy-policy';
import { Screen } from '@/shared/components/Screen';
import { useTheme } from '@/shared/theme/ThemeContext';

export function PrivacyPolicyScreen() {
  const { palette } = useTheme();

  return (
    <Screen>
      <Text
        testID="privacy-draft"
        style={[styles.draft, { color: palette.textWarning, backgroundColor: palette.surface, borderColor: palette.border }]}
      >
        {PRIVACY_POLICY_DRAFT}
      </Text>
      <Text
        testID="privacy-policy"
        accessibilityRole="header"
        style={[styles.title, { color: palette.text }]}
      >
        {PRIVACY_POLICY_TITLE}
      </Text>
      <Text testID="privacy-version" style={[styles.version, { color: palette.textPrimary }]}>
        Versión {PRIVACY_POLICY_VERSION}
      </Text>
      <Text style={[styles.body, { color: palette.textMuted }]}>{PRIVACY_POLICY_INTRO}</Text>
      {PRIVACY_POLICY_SECTIONS.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text accessibilityRole="header" style={[styles.heading, { color: palette.text }]}>
            {section.heading}
          </Text>
          <Text style={[styles.body, { color: palette.text }]}>{section.body}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  draft: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  version: { marginTop: 10, fontSize: 13, fontWeight: '800' },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 24 },
  section: { marginTop: 28 },
});
