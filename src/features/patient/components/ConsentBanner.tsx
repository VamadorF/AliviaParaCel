import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconTile } from '@/shared/icons/AppIcon';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { useTheme } from '@/shared/theme/ThemeContext';

/** MOB-06 · Aviso visible solo con el consentimiento revocado (paridad `consent-banner` web, PAC-02). */
export function ConsentBanner({ context }: { context: 'diario' | 'checkin' }) {
  const { palette, mode } = useTheme();
  const { consent } = usePatientSession();
  if (consent.granted) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: mode === 'dark' ? '#3a2e22' : '#fdf8f0',
          borderColor: palette.warning,
        },
      ]}
      accessibilityLiveRegion="polite"
      testID="consent-banner"
    >
      <IconTile
        name="shield"
        color={palette.warning}
        background={palette.surface}
        size={32}
        iconSize={16}
      />
      <Text style={[styles.text, { color: palette.text }]}>
        <Text style={styles.strong}>Consentimiento revocado: </Text>
        {context === 'checkin'
          ? 'este registro se guardará solo en tu teléfono y no se compartirá con tu equipo médico.'
          : 'tus nuevos registros se guardan solo en tu teléfono y no se comparten con tu equipo médico.'}{' '}
        Puedes reactivarlo en Perfil.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 20 },
  strong: { fontWeight: '800' },
});
