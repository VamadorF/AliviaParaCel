import * as SecureStore from 'expo-secure-store';
import type { StoragePort } from '@/shared/storage/storagePort';

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function browserStorage(): WebStorage | null {
  const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
  return storage ?? null;
}

/**
 * En el teléfono el token va a expo-secure-store.
 * En web (Expo / Playwright) el módulo nativo no existe: mismo contrato sobre localStorage.
 */
export const secureTokenStorage: StoragePort = {
  async getItem(key) {
    if (await SecureStore.isAvailableAsync()) {
      return SecureStore.getItemAsync(key);
    }
    return browserStorage()?.getItem(key) ?? null;
  },
  async setItem(key, value) {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const storage = browserStorage();
    if (!storage) {
      throw new Error('No hay almacenamiento seguro en este dispositivo.');
    }
    storage.setItem(key, value);
  },
  async removeItem(key) {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    browserStorage()?.removeItem(key);
  },
};
