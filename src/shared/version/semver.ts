/** MOB-14 · Comparación semver simple (major.minor.patch). */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const pb = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i += 1) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

/** True si la versión instalada es estrictamente menor que la mínima exigida. */
export function isAppUpdateRequired(installed: string, minimum: string): boolean {
  return compareSemver(installed, minimum) < 0;
}
