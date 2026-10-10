/** Lo que reporta `@react-native-community/netinfo`. */
export type Connectivity = {
  isConnected: boolean | null;
  isInternetReachable?: boolean | null;
};

/**
 * Hay red salvo que NetInfo afirme que no hay conexión o que internet no es alcanzable.
 * `null` (todavía no se sabe) cuenta como con red.
 */
export function isOnline(state: Connectivity): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}
