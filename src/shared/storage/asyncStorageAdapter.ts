import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoragePort } from '@/shared/storage/storagePort';

export const asyncStoragePort: StoragePort = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
