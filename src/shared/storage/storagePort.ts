export type StoragePort = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export function createMemoryStorage(initial: Record<string, string> = {}): StoragePort {
  const store = { ...initial };
  return {
    async getItem(key) {
      return store[key] ?? null;
    },
    async setItem(key, value) {
      store[key] = value;
    },
    async removeItem(key) {
      delete store[key];
    },
  };
}
