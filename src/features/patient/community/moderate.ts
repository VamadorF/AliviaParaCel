/**
 * MOB-11 · Misma lista que `moderate()` de la web (`data/seed.ts`).
 * `true` significa rechazar: texto vacío o claramente abusivo.
 */
const ABUSIVE = [
  'idiota',
  'estupido',
  'estúpido',
  'imbecil',
  'imbécil',
  'odio a',
  'tonto',
  'basura',
  'inutil',
  'inútil',
];

export function moderate(t: string): boolean {
  const text = t.trim().toLowerCase();
  if (!text) return true;
  return ABUSIVE.some((word) => text.includes(word));
}
