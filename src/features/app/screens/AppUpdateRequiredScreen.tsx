import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogoMark } from '@/shared/brand/Brand';
import { Screen } from '@/shared/components/Screen';
import { useTheme } from '@/shared/theme/ThemeContext';

type Props = {
  installedVersion: string;
  requiredVersion: string;
};

/** MOB-14 · Pantalla bloqueante cuando el mock exige una versión más nueva. */
export function AppUpdateRequiredScreen({ installedVersion, requiredVersion }: Props) {
  const { palette } = useTheme();
  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <LogoMark size={72} bg={palette.background} />
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: palette.text }]}
          testID="app-update-title"
        >
          Actualiza AlivIA
        </Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>
          Esta versión ({installedVersion}) ya no es compatible. Instala la versión {requiredVersion} o
          superior desde la tienda de aplicaciones para seguir usando AlivIA con tu equipo.
        </Text>
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          Si acabas de instalar y ves este mensaje, avisa a tu centro: puede ser una prueba de versión
          mínima en el entorno demo.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 20 },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  hint: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
});
