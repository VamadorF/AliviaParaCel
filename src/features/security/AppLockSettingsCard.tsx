import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  APP_LOCK_KEY,
  DEFAULT_APP_LOCK,
  hashPin,
  parseAppLock,
  pinValid,
  type AppLockSettings,
} from '@/features/security/app-lock';
import { Card } from '@/shared/components/Card';
import { asyncStoragePort } from '@/shared/storage/asyncStorageAdapter';
import { useTheme } from '@/shared/theme/ThemeContext';

export function AppLockSettingsCard() {
  const { palette } = useTheme();
  const [settings, setSettings] = useState<AppLockSettings>(DEFAULT_APP_LOCK);
  const [pin, setPin] = useState('');

  useEffect(() => {
    void asyncStoragePort.getItem(APP_LOCK_KEY).then((raw) => setSettings(parseAppLock(raw)));
  }, []);

  const persist = (next: AppLockSettings) => {
    setSettings(next);
    void asyncStoragePort.setItem(APP_LOCK_KEY, JSON.stringify(next));
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: '800', color: palette.text }}>Privacidad del dispositivo</Text>
      <Text style={{ color: palette.textMuted, marginTop: 6, lineHeight: 21 }}>
        Bloqueo opcional con biometría o PIN tras unos minutos en segundo plano. Oculta el contenido en
        el selector de apps.
      </Text>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: settings.enabled }}
        onPress={() => persist({ ...settings, enabled: !settings.enabled })}
        style={{ marginTop: 12 }}
      >
        <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>
          Bloqueo {settings.enabled ? 'activado' : 'desactivado'}
        </Text>
      </Pressable>
      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="PIN de 4 a 6 dígitos"
        placeholderTextColor={palette.textMuted}
        style={{
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 12,
          padding: 12,
          marginTop: 10,
          color: palette.text,
          backgroundColor: palette.surface,
          minHeight: 48,
        }}
      />
      <View style={{ marginTop: 8 }}>
        <Pressable
          accessibilityRole="button"
          disabled={!pinValid(pin)}
          onPress={() => {
            if (!pinValid(pin)) return;
            persist({ ...settings, enabled: true, pinHash: hashPin(pin) });
            setPin('');
          }}
        >
          <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>Guardar PIN</Text>
        </Pressable>
      </View>
    </Card>
  );
}
