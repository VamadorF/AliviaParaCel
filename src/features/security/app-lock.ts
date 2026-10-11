/** MOB-25 · Bloqueo opcional con biometría o PIN. */

export type AppLockSettings = {
  enabled: boolean;
  /** Minutos en segundo plano antes de bloquear. */
  timeoutMinutes: number;
  /** Hash simple del PIN (mock local). */
  pinHash?: string;
  useBiometric: boolean;
};

export const APP_LOCK_KEY = '@alivia/app-lock/v1';

export const DEFAULT_APP_LOCK: AppLockSettings = {
  enabled: false,
  timeoutMinutes: 5,
  useBiometric: true,
};

export function hashPin(pin: string): string {
  return `pin-${pin.replace(/\D/g, '')}`;
}

export function pinValid(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function shouldLockAfterBackground(
  settings: AppLockSettings,
  lastBackgroundAt: number | null,
  nowMs: number,
): boolean {
  if (!settings.enabled || !lastBackgroundAt) return false;
  return nowMs - lastBackgroundAt >= settings.timeoutMinutes * 60_000;
}

export function parseAppLock(raw: string | null): AppLockSettings {
  if (!raw) return { ...DEFAULT_APP_LOCK };
  try {
    const parsed = JSON.parse(raw) as AppLockSettings;
    if (!parsed || typeof parsed.enabled !== 'boolean') return { ...DEFAULT_APP_LOCK };
    return {
      ...DEFAULT_APP_LOCK,
      ...parsed,
      timeoutMinutes: Math.min(60, Math.max(1, parsed.timeoutMinutes ?? 5)),
    };
  } catch {
    return { ...DEFAULT_APP_LOCK };
  }
}
