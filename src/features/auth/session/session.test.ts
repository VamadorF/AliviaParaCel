import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStorage } from '@/shared/storage/storagePort';
import {
  AUTH_TOKEN_KEY,
  canWriteUserCache,
  clearQueryCache,
  createMockToken,
  forgetSessionToken,
  restoreSessionUser,
  saveSessionToken,
  setActiveUserId,
  userIdFromMockToken,
} from '@/features/auth/session/session';

describe('MOB-03 · token y cierre de sesión', () => {
  beforeEach(() => {
    setActiveUserId(null);
  });

  it('el token mock identifica a la persona y rechaza basura', () => {
    expect(userIdFromMockToken(createMockToken('constanza', 'abc'))).toBe('constanza');
    expect(userIdFromMockToken('mock.constanza')).toBeNull();
    expect(userIdFromMockToken('mock.constanza.abc.extra')).toBeNull();
    expect(() => createMockToken('con stan za')).toThrow();
  });

  it('restaura a quien guardó el token', async () => {
    const storage = createMemoryStorage();
    await saveSessionToken(storage, createMockToken('nuevo', 'abc'));
    const user = await restoreSessionUser(storage);
    expect(user?.id).toBe('nuevo');
    expect(user?.name).toBe('María López');
  });

  it('un token inválido no restaura y se borra', async () => {
    const unknown = createMemoryStorage({
      [AUTH_TOKEN_KEY]: createMockToken('nadie', 'abc'),
    });
    expect(await restoreSessionUser(unknown)).toBeNull();
    expect(await unknown.getItem(AUTH_TOKEN_KEY)).toBeNull();

    const garbage = createMemoryStorage({ [AUTH_TOKEN_KEY]: 'jwt-real' });
    expect(await restoreSessionUser(garbage)).toBeNull();
    expect(await garbage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('cerrar sesión borra el token y bloquea la caché de esa persona', async () => {
    const storage = createMemoryStorage();
    await saveSessionToken(storage, createMockToken('constanza', 'abc'));
    setActiveUserId('constanza');
    expect(canWriteUserCache('constanza')).toBe(true);

    let cleared = false;
    clearQueryCache({
      cancelQueries: async () => undefined,
      clear: () => {
        cleared = true;
      },
    });
    await forgetSessionToken(storage);

    expect(cleared).toBe(true);
    expect(await storage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(await restoreSessionUser(storage)).toBeNull();
    expect(canWriteUserCache('constanza')).toBe(false);
    expect(canWriteUserCache('nuevo')).toBe(false);
  });
});
