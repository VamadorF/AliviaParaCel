/** MOB-24 · Utilidades de deep link sin React Navigation. */

export function consultaDeepLink(appointmentId: string) {
  return `alivia://consulta/${encodeURIComponent(appointmentId)}`;
}

export function parseConsultaDeepLink(url: string): string | null {
  const match = url.match(/^alivia:\/\/consulta\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}
