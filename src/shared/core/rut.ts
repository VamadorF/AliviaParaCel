// Generado: no editar

// Utilidades de RUT chileno: cuerpo numérico + dígito verificador (módulo 11).
// Forma canónica de almacenamiento: "12345678-9" (sin puntos, DV en mayúscula).

/** Deja el RUT en forma canónica "cuerpo-DV". No valida. */
export function normalizeRut(input: string): string {
  const clean = input.replace(/[.\s]/g, '').replace(/‐|–|—/g, '-').toUpperCase().trim();
  const m = clean.match(/^(\d+)-?([\dK])$/);
  if (!m) return clean; // se deja tal cual; isValidRut lo rechazará
  return m[1] + '-' + m[2];
}

/** Dígito verificador módulo 11 para un cuerpo numérico. */
export function computeDv(body: string): string {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  return rest === 11 ? '0' : rest === 10 ? 'K' : String(rest);
}

/** Valida estructura y dígito verificador. */
export function isValidRut(input: string): boolean {
  const rut = normalizeRut(input);
  const m = rut.match(/^(\d{7,9})-([\dK])$/);
  if (!m) return false;
  return computeDv(m[1]) === m[2];
}

/** Formato de despliegue con puntos: 12.345.678-9 */
export function formatRut(input: string): string {
  const rut = normalizeRut(input);
  const m = rut.match(/^(\d+)-([\dK])$/);
  if (!m) return input;
  return m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + m[2];
}

/** Igualdad de RUTs sin importar formato de entrada. */
export function sameRut(a: string, b: string): boolean {
  return normalizeRut(a) === normalizeRut(b);
}
