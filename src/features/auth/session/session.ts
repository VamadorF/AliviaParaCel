import { findUserById, type MockUser } from '@/shared/mocks/users.mock';
import type { StoragePort } from '@/shared/storage/storagePort';

/** Clave válida para expo-secure-store (alfanumérica, `.`, `-`, `_`). */
export const AUTH_TOKEN_KEY = 'alivia.auth.token';

const TOKEN_RE = /^mock\.([A-Za-z0-9_-]+)\.([A-Za-z0-9]+)$/;

let activeUserId: string | null = null;

export function setActiveUserId(userId: string | null) {
  activeUserId = userId;
}

export function getActiveUserId() {
  return activeUserId;
}

/** Evita que un guardado en vuelo vuelva a llenar la caché después del logout. */
export function canWriteUserCache(userId: string | null | undefined) {
  return Boolean(userId) && activeUserId === userId;
}

export function createMockToken(userId: string, nonce?: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(userId)) {
    throw new Error('Identificador inválido para el token mock.');
  }
  const suffix = nonce ?? Date.now().toString(36);
  if (!/^[A-Za-z0-9]+$/.test(suffix)) {
    throw new Error('Nonce inválido para el token mock.');
  }
  return `mock.${userId}.${suffix}`;
}

export function userIdFromMockToken(token: string): string | null {
  return TOKEN_RE.exec(token)?.[1] ?? null;
}

export async function saveSessionToken(storage: StoragePort, token: string) {
  await storage.setItem(AUTH_TOKEN_KEY, token);
}

export async function restoreSessionUser(storage: StoragePort): Promise<MockUser | null> {
  const token = await storage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  const user = findUserById(userIdFromMockToken(token) ?? '');
  if (!user) {
    await storage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
  return user;
}

export async function forgetSessionToken(storage: StoragePort) {
  await storage.removeItem(AUTH_TOKEN_KEY);
  setActiveUserId(null);
}

export function clearQueryCache(cache: {
  cancelQueries: () => Promise<unknown>;
  clear: () => void;
}) {
  void cache.cancelQueries();
  cache.clear();
}
