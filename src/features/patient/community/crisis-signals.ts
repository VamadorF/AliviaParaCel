/**
 * COM-06 · Señales que dejan una publicación en revisión (D-04).
 * Lista corta de frases, la misma de la web. No es un manual ni un consejo clínico.
 */
export const CRISIS_SIGNALS = [
  'quiero morirme',
  'me quiero morir',
  'no quiero seguir viviendo',
  'me voy a matar',
  'quiero suicidarme',
] as const;

export const COMMUNITY_MONITOR_NOTICE =
  'La Comunidad no se monitorea en tiempo real. Si estás en riesgo, llama al 131 o al *4141.';

export const MODERATOR_REVIEW_COPY = 'La revisa un moderador de Mejora Digital en máximo 24 horas.';

export function matchesCrisisSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  return CRISIS_SIGNALS.some((phrase) => normalized.includes(phrase));
}
