import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/AuthProvider';
import { API_URL, IS_DEVELOPMENT } from '@/app/config/env';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { useTheme } from '@/shared/theme/ThemeContext';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { palette, toggleMode } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <Card>
        <Text style={[styles.name, { color: palette.text }]}>
          {user?.name ?? '—'}
        </Text>
        <Text style={{ color: palette.textMuted }}>{user?.email}</Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>
          Token mock: {user?.token}
        </Text>
      </Card>

      <Card>
        <Text style={{ color: palette.textMuted }}>API_URL</Text>
        <Text style={{ color: palette.text }}>{API_URL}</Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>
          __DEV__: {String(IS_DEVELOPMENT)}
        </Text>
      </Card>

      <Button label={t('profile.theme')} variant="ghost" onPress={toggleMode} />
      <Button label={t('profile.logout')} onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 12, marginTop: 8 },
});
