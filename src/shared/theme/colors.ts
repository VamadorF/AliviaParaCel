export const colors = {
  light: {
    background: '#eef1ec',
    surface: '#ffffff',
    text: '#16211c',
    textMuted: '#71807a',
    primary: '#256e4d',
    primarySoft: '#e6f2ec',
    border: '#e7ebe7',
    danger: '#b03a44',
    warning: '#e08a2f',
    accent: '#4f5bc0',
    accentSoft: '#eef2fb',
  },
  dark: {
    background: '#1a211e',
    surface: '#243028',
    text: '#eef1ec',
    textMuted: '#9aa8a1',
    primary: '#3d9a6f',
    primarySoft: '#2a4034',
    border: '#3d4a42',
    danger: '#e07a84',
    warning: '#e8a55a',
    accent: '#8b96e8',
    accentSoft: '#2a3048',
  },
} as const;

export type ThemeMode = keyof typeof colors;
