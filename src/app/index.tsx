import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { LogoMark } from '@/shared/brand/Brand';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/app/providers/AuthProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { navigationRef } from '@/app/navigation/navigationRef';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import i18n from '@/shared/i18n';
import { ThemeProvider, useTheme } from '@/shared/theme/ThemeContext';

function AppShell() {
  const { palette, mode } = useTheme();
  const { isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: palette.background,
        }}
      >
        <LogoMark size={72} bg={palette.background} />
        <ActivityIndicator color={palette.primary} style={{ marginTop: 18 }} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <AppShell />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
