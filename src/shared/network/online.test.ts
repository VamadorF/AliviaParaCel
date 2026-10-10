import { describe, expect, it } from 'vitest';
import { isOnline } from '@/shared/network/online';

describe('isOnline', () => {
  it('sin conexión o sin internet alcanzable es sin red', () => {
    expect(isOnline({ isConnected: false, isInternetReachable: false })).toBe(false);
    expect(isOnline({ isConnected: false, isInternetReachable: null })).toBe(false);
    expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it('conectado o todavía desconocido cuenta como con red', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
    expect(isOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isOnline({ isConnected: null, isInternetReachable: null })).toBe(true);
  });
});
