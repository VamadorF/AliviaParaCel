/** Serie diaria de dolor (promedio por día). Sin dependencias de React Native. */
export function dailyPainSeries(checkIns: { date: string; pain: number }[]): number[] {
  const byDay = new Map<string, number[]>();
  for (const entry of checkIns) {
    const list = byDay.get(entry.date) ?? [];
    list.push(entry.pain);
    byDay.set(entry.date, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, pains]) => pains.reduce((sum, n) => sum + n, 0) / pains.length);
}
