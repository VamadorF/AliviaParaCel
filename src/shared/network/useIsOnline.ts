import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { isOnline } from '@/shared/network/online';

export type OnlineState = {
  /** False hasta el primer reporte de NetInfo, para no sincronizar antes de saber. */
  online: boolean;
  ready: boolean;
};

export function useIsOnline(): OnlineState {
  const [state, setState] = useState<OnlineState>({ online: false, ready: false });

  useEffect(() => {
    const apply = (net: NetInfoState) => setState({ online: isOnline(net), ready: true });
    const unsubscribe = NetInfo.addEventListener(apply);
    NetInfo.fetch().then(apply).catch(() => setState({ online: false, ready: true }));
    return unsubscribe;
  }, []);

  return state;
}
