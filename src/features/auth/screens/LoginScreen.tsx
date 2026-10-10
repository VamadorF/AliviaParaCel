import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/shared/components/Button';
import { BetaBanner } from '@/shared/components/BetaBanner';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { BrandLockup } from '@/shared/brand/Brand';
import { AppIcon } from '@/shared/icons/AppIcon';
import { formatRut } from '@/shared/data/rut';
import {
  CLEAN_PASSWORD,
  CLEAN_RUT,
  DEMO_PASSWORD,
  DEMO_RUT,
} from '@/shared/mocks/users.mock';
import { useTheme } from '@/shared/theme/ThemeContext';

export function LoginScreen() {
  const { palette, mode } = useTheme();
  const { signInWithRut, signInAsDemo, isLoading } = useAuth();
  const [rut, setRut] = useState(formatRut(DEMO_RUT));
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    try {
      await signInWithRut(rut, password);
    } catch (e) {
      Alert.alert('Ingreso', (e as Error).message);
    }
  };

  return (
    <Screen>
      <BetaBanner />
      <View accessibilityRole="header" style={styles.brand}>
        <BrandLockup size={56} fontSize={32} dark={mode === 'dark'} bg={palette.background} />
      </View>
      <View style={styles.subtitleRow}>
        <AppIcon name="heart" size={18} color={palette.primary} />
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>Mi AlivIA · Pacientes</Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="RUT"
          value={rut}
          onChangeText={setRut}
          placeholder="12.345.678-5"
          accessibilityHint="Ingresa tu RUT chileno con dígito verificador"
          testID="login-rut"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña de prueba"
          secureTextEntry
          autoCorrect={false}
          accessibilityHint="Contraseña de la beta, indicada bajo el formulario"
          testID="login-password"
        />
        <Button
          label="Entrar con RUT"
          onPress={() => void handleSubmit()}
          loading={isLoading}
          testID="login-submit"
        />
        <View style={styles.spacer} />
        <Button
          label="Entrar en modo demo"
          variant="ghost"
          onPress={() => void signInAsDemo()}
          loading={isLoading}
          accessibilityHint="Constanza Elizondo, datos de demostración"
          testID="login-demo"
        />
      </View>

      <Text style={[styles.hint, { color: palette.textMuted }]}>
        Demo: {formatRut(DEMO_RUT)} · clave {DEMO_PASSWORD}
        {'\n'}
        Usuario nuevo: {formatRut(CLEAN_RUT)} · clave {CLEAN_PASSWORD}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { marginTop: 12 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 28 },
  subtitle: { fontSize: 17 },
  form: { flex: 1 },
  spacer: { height: 12 },
  hint: { fontSize: 13, lineHeight: 20, marginTop: 24 },
});
