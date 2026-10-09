export function normalizeRut(input: string): string {
  const clean = input.replace(/[.\s]/g, '').replace(/‐|–|—/g, '-').toUpperCase().trim();
  const m = clean.match(/^(\d+)-?([\dK])$/);
  if (!m) return clean;
  return m[1] + '-' + m[2];
}

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

export function isValidRut(input: string): boolean {
  const rut = normalizeRut(input);
  const m = rut.match(/^(\d{7,9})-([\dK])$/);
  if (!m) return false;
  return computeDv(m[1]) === m[2];
}

export function formatRut(input: string): string {
  const rut = normalizeRut(input);
  const m = rut.match(/^(\d+)-([\dK])$/);
  if (!m) return input;
  return m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + m[2];
}

export function sameRut(a: string, b: string): boolean {
  return normalizeRut(a) === normalizeRut(b);
}
