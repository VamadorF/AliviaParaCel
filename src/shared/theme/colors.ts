export const colors = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    primary: '#2563eb',
    border: '#e2e8f0',
    danger: '#dc2626',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    primary: '#60a5fa',
    border: '#334155',
    danger: '#f87171',
  },
} as const;

export type ThemeMode = keyof typeof colors;
