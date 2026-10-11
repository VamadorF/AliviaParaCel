/** Opciones de ánimo del check-in (PAC-06). Misma lista que la web, sin género gramatical. */
export const MOOD_OPTIONS = [
  'Muy mal',
  'Mal',
  'Regular',
  'Bien',
  'Muy bien',
  'Con cansancio',
  'Con ansiedad',
] as const;

const OPTION_SET = new Set<string>(MOOD_OPTIONS);

/** Texto guardado, sin reescribirlo. "Cansada", "Ansiosa" o "Muy bien" se muestran igual. */
export function moodLabel(stored: string | null | undefined): string {
  return (stored ?? '').trim();
}

/** Chips del formulario. Si el borrador trae un ánimo antiguo, ese valor se sigue mostrando. */
export function moodChoices(current: string | null | undefined): string[] {
  const saved = moodLabel(current);
  if (saved && !OPTION_SET.has(saved)) return [...MOOD_OPTIONS, saved];
  return [...MOOD_OPTIONS];
}
