import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { IconTile } from '@/shared/icons/AppIcon';
import { usePatientSession } from '@/features/patient/context/PatientSessionContext';
import { useTheme } from '@/shared/theme/ThemeContext';

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** MOB-06 · Perfil: estado, aceptar/revocar e historial del consentimiento (paridad PAC-02 web). */
export function ConsentCard() {
  const { palette } = useTheme();
  const { consent, consentHistory, setConsent, isSavingConsent } = usePatientSession();

  const status = consent.granted
    ? `Aceptado · ${consent.since ? `vigente desde ${fecha(consent.since)}` : 'vigente'} · versión ${consent.version}`
    : `Revocado${consent.since ? ` el ${fecha(consent.since)}` : ''} · no se comparten nuevos registros`;
  const description = consent.granted
    ? 'AlivIA guarda tus registros de dolor, ánimo y sueño para compartirlos con tu equipo médico. Puedes revocarlo cuando quieras: tus nuevos registros quedarán solo en este teléfono.'
    : 'Revocaste tu consentimiento: tus nuevos registros quedan solo en este teléfono y no se comparten con tu equipo. Tu información anterior se conserva según la normativa vigente. Reactívalo cuando quieras para retomar el seguimiento con tu equipo.';

  return (
    <Card testID="consent-card">
      <View style={styles.head}>
        <IconTile name="shield" color={palette.primary} background={palette.primarySoft} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
            Consentimiento de tratamiento de datos
          </Text>
          <Text
            style={{ color: palette.text, fontSize: 13, fontWeight: '700', marginTop: 4 }}
            accessibilityLiveRegion="polite"
            testID="consent-status"
          >
            {status}
          </Text>
        </View>
      </View>
      <Text style={{ color: palette.textMuted, lineHeight: 21, marginVertical: 12 }}>{description}</Text>
      <Button
        label={consent.granted ? 'Revocar consentimiento' : 'Aceptar consentimiento'}
        variant={consent.granted ? 'ghost' : 'primary'}
        onPress={() => setConsent(!consent.granted)}
        disabled={isSavingConsent}
        testID="consent-toggle"
      />
      <View style={{ marginTop: 16 }} testID="consent-history">
        <Text style={[styles.kicker, { color: palette.textMuted }]}>HISTORIAL DE CONSENTIMIENTO</Text>
        {consentHistory.length === 0 ? (
          <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 6 }}>
            Aún no hay cambios registrados.
          </Text>
        ) : (
          consentHistory.map((e) => (
            <Text
              key={e.id}
              style={{ color: palette.text, fontSize: 13, lineHeight: 20, marginTop: 6 }}
              testID="consent-event"
            >
              {e.action === 'aceptado' ? 'Aceptado' : 'Revocado'} el {fecha(e.createdAt)} · versión {e.version}
            </Text>
          ))
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 15, fontWeight: '800' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
});
