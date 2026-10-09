import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { useResetDemoDataMutation } from '@/features/patient/hooks/usePatientBootstrap';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { IconTile } from '@/shared/icons/AppIcon';
import { formatRut } from '@/shared/data/rut';
import { useTheme } from '@/shared/theme/ThemeContext';

export function PatientProfileScreen() {
  const { palette, mode, toggleMode } = useTheme();
  const { user, signOut } = useAuth();
  const resetDemo = useResetDemoDataMutation();
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const onResetDemo = () => {
    resetDemo.mutate(undefined, {
      onSuccess: () => {
        setResetMessage('Datos de demostración restablecidos');
      },
    });
  };

  return (
    <Screen>
      <BetaBanner />
      <Text style={[styles.h1, { color: palette.text }]} accessibilityRole="header">
        Perfil
      </Text>
      <Card>
        <View style={styles.identity}>
          <IconTile name="person" color={palette.primary} background={palette.primarySoft} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 18, color: palette.text }}>{user?.name}</Text>
            <Text style={{ color: palette.textMuted, marginTop: 6 }}>
              RUT {user ? formatRut(user.rut) : '—'}
            </Text>
          </View>
        </View>
      </Card>
      <Card>
        <View style={styles.identity}>
          <IconTile name="warn" color={palette.danger} background={mode === 'dark' ? '#3a2428' : '#fbe9ea'} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: palette.danger }}>En caso de crisis de dolor</Text>
            <Text style={{ color: palette.textMuted, marginTop: 6, lineHeight: 21 }}>
              Urgencias: <Text style={{ fontWeight: '800' }}>131</Text>
            </Text>
          </View>
        </View>
      </Card>
      {user?.profile === 'demo' ? (
        <>
          <Button
            label="Restablecer datos demo"
            variant="ghost"
            onPress={onResetDemo}
            disabled={resetDemo.isPending}
          />
          {resetMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: palette.primary, fontWeight: '600', marginBottom: 8 }}
            >
              {resetMessage}
            </Text>
          ) : null}
        </>
      ) : null}
      <Button label="Cerrar sesión" variant="ghost" onPress={signOut} />
      <View style={{ height: 8 }} />
      <Button label="Cambiar tema" variant="ghost" onPress={toggleMode} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
