import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { APP_LOCK_KEY, hashPin, parseAppLock, pinValid, shouldLockAfterBackground } from '@/features/security/app-lock';
import { asyncStoragePort } from '@/shared/storage/asyncStorageAdapter';
import { useTheme } from '@/shared/theme/ThemeContext';

type AppLockGateProps = {
  children: React.ReactNode;
};

export function AppLockGate({ children }: AppLockGateProps) {
  const { palette } = useTheme();
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(parseAppLock(null));
  const lastBg = React.useRef<number | null>(null);

  useEffect(() => {
    void asyncStoragePort.getItem(APP_LOCK_KEY).then((raw) => setSettings(parseAppLock(raw)));
  }, []);

  useEffect(() => {
    if (!settings.enabled) {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      return;
    }
    void ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [settings.enabled]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        lastBg.current = Date.now();
        return;
      }
      if (state === 'active' && shouldLockAfterBackground(settings, lastBg.current, Date.now())) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [settings]);

  const unlockWithBiometric = useCallback(async () => {
    if (!settings.useBiometric) return;
    const supported = await LocalAuthentication.hasHardwareAsync();
    if (!supported) return;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear AlivIA',
      cancelLabel: 'Usar PIN',
    });
    if (result.success) {
      setLocked(false);
      setPin('');
      setError('');
    }
  }, [settings.useBiometric]);

  const tryPin = () => {
    if (!settings.pinHash) {
      setError('Configura un PIN en Perfil → Privacidad del dispositivo.');
      return;
    }
    if (!pinValid(pin)) {
      setError('El PIN debe tener entre 4 y 6 dígitos.');
      return;
    }
    if (hashPin(pin) !== settings.pinHash) {
      setError('PIN incorrecto.');
      return;
    }
    setLocked(false);
    setPin('');
    setError('');
  };

  if (!settings.enabled || !locked) return <>{children}</>;

  return (
    <View style={[styles.overlay, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
        AlivIA bloqueada
      </Text>
      <Text style={{ color: palette.textMuted, textAlign: 'center', marginBottom: 12 }}>
        Tu contenido está oculto hasta que te identifiques.
      </Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        accessibilityLabel="PIN de desbloqueo"
        placeholder="PIN"
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface },
        ]}
      />
      {error ? (
        <Text style={{ color: palette.textDanger, marginTop: 8 }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Desbloquear con PIN"
        onPress={tryPin}
        style={[styles.btn, { backgroundColor: palette.primary }]}
      >
        <Text style={{ color: palette.onPrimary, fontWeight: '800' }}>Desbloquear</Text>
      </Pressable>
      {settings.useBiometric ? (
        <Pressable accessibilityRole="button" onPress={() => void unlockWithBiometric()} style={{ marginTop: 12 }}>
          <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>Usar biometría</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    minHeight: 48,
  },
  btn: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
