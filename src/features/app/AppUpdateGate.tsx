import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppUpdateRequiredScreen } from '@/features/app/screens/AppUpdateRequiredScreen';
import { fetchMockAppConfig } from '@/shared/mocks/app-config.mock';
import { useTheme } from '@/shared/theme/ThemeContext';
import { installedAppVersion } from '@/shared/version/installed-version';
import { isAppUpdateRequired } from '@/shared/version/semver';

type Props = { children: React.ReactNode };

/** MOB-14 · Bloquea la navegación si minAppVersion del mock supera la app instalada. */
export function AppUpdateGate({ children }: Props) {
  const { palette } = useTheme();
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'ok' } | { kind: 'blocked'; min: string; installed: string }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void fetchMockAppConfig().then((config) => {
      if (cancelled) return;
      const installed = installedAppVersion();
      if (isAppUpdateRequired(installed, config.minAppVersion)) {
        setState({ kind: 'blocked', min: config.minAppVersion, installed });
        return;
      }
      setState({ kind: 'ok' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }
  if (state.kind === 'blocked') {
    return (
      <AppUpdateRequiredScreen installedVersion={state.installed} requiredVersion={state.min} />
    );
  }
  return <>{children}</>;
}
