/**
 * Rellenos (`primary`, `warning`, `danger`, `accent`) y letra (`text*`) van aparte
 * cuando el mismo color no sirve para las dos cosas (D-01).
 */
export const colors = {
  light: {
    background: '#eef1ec',
    surface: '#ffffff',
    text: '#16211c',
    textMuted: '#5c6a64',
    textPrimary: '#256e4d',
    textDanger: '#b03a44',
    textWarning: '#995a17',
    textAccent: '#4f5bc0',
    onPrimary: '#ffffff',
    primary: '#256e4d',
    primarySoft: '#e6f2ec',
    border: '#e7ebe7',
    danger: '#b03a44',
    warning: '#e08a2f',
    accent: '#4f5bc0',
    accentSoft: '#eef2fb',
    surfaceMuted: '#f7f9f6',
    prompt: '#2b7a58',
    crisisSurface: '#fbf6f3',
    crisisBorder: '#f3e3dc',
    warnSurface: '#fbe9ea',
    instructionBorder: '#dde5f6',
    badgePendingBg: '#fdf1e4',
    badgePendingBgDark: '#3a2e22',
    promptSurfaceDark: '#1e4d38',
    warnSurfaceDark: '#3a2428',
  },
  dark: {
    background: '#1a211e',
    surface: '#243028',
    text: '#eef1ec',
    textMuted: '#a8b4ae',
    textPrimary: '#5abe90',
    textDanger: '#e7969e',
    textWarning: '#e8a55a',
    textAccent: '#aab2ee',
    onPrimary: '#16211c',
    primary: '#3d9a6f',
    primarySoft: '#2a4034',
    border: '#3d4a42',
    danger: '#e07a84',
    warning: '#e8a55a',
    accent: '#8b96e8',
    accentSoft: '#2a3048',
    surfaceMuted: '#243028',
    prompt: '#3d9a6f',
    crisisSurface: '#243028',
    crisisBorder: '#3d4a42',
    warnSurface: '#3a2428',
    instructionBorder: '#3d4a42',
    badgePendingBg: '#3a2e22',
    badgePendingBgDark: '#3a2e22',
    promptSurfaceDark: '#1e4d38',
    warnSurfaceDark: '#3a2428',
  },
} as const;

export type ThemeMode = keyof typeof colors;

/** Fondos contra los que el PO midió el texto (D-01). */
export const contrastSurfaces = {
  light: ['#ffffff', '#f7f9f6', '#eef1ec', '#e6f2ec', '#eef2fb', '#fdf1e4'],
  dark: ['#1a211e', '#243028', '#2a4034'],
} as const;
