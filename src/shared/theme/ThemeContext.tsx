import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors, type ThemeMode } from './colors';

type ThemeContextValue = {
  mode: ThemeMode;
  palette: (typeof colors)[ThemeMode];
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const mode: ThemeMode = override ?? (system === 'dark' ? 'dark' : 'light');

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      palette: colors[mode],
      toggleMode: () =>
        setOverride((prev) => {
          const current = prev ?? (system === 'dark' ? 'dark' : 'light');
          return current === 'dark' ? 'light' : 'dark';
        }),
    }),
    [mode, system],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
