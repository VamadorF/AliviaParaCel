import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/AuthProvider';
import { APP_NAME } from '@/app/config/env';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { DEMO_USER } from '@/shared/mocks/users.mock';
import { useTheme } from '@/shared/theme/ThemeContext';

export function LoginScreen() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { signIn, signInAsDemo, isLoading } = useAuth();
  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState('cualquier-clave');

  const handleSubmit = async () => {
    try {
      await signIn(email, password);
    } catch (e) {
      Alert.alert('Mock auth', (e as Error).message);
    }
  };

  return (
    <Screen scroll={false}>
      <Text style={[styles.title, { color: palette.text }]}>{APP_NAME}</Text>
      <Text style={[styles.subtitle, { color: palette.textMuted }]}>
        {t('login.title')}
      </Text>

      <View style={styles.form}>
        <TextField
          label={t('login.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="demo@plantilla.app"
        />
        <TextField
          label={t('login.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button
          label={t('login.submit')}
          onPress={() => void handleSubmit()}
          loading={isLoading}
        />
        <View style={styles.spacer} />
        <Button
          label={t('login.demo')}
          variant="ghost"
          onPress={() => void signInAsDemo()}
          loading={isLoading}
        />
      </View>

      <Text style={[styles.hint, { color: palette.textMuted }]}>
        {t('login.hint')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginTop: 24 },
  subtitle: { fontSize: 18, marginTop: 8, marginBottom: 32 },
  form: { flex: 1 },
  spacer: { height: 12 },
  hint: { fontSize: 13, lineHeight: 20, marginTop: 24 },
});
