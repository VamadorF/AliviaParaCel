import { dailyPainSeries } from '@/features/patient/utils/pain-series';
import type { CheckInRecord } from '@/features/patient/types';

export const PROGRESS_RECENT_MAX = 12;

export const INSUFFICIENT_PROGRESS_COPY =
  'Aún no hay suficientes registros para dibujar tu curva';

export function sortedCheckInsNewestFirst(checkIns: CheckInRecord[]): CheckInRecord[] {
  return [...checkIns].sort((a, b) => {
    const ta = Date.parse(`${a.date}T${a.time || '00:00'}`);
    const tb = Date.parse(`${b.date}T${b.time || '00:00'}`);
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    return b.id.localeCompare(a.id);
  });
}

export function recentCheckIns(checkIns: CheckInRecord[], limit = PROGRESS_RECENT_MAX): CheckInRecord[] {
  return sortedCheckInsNewestFirst(checkIns).slice(0, limit);
}

export function checkInStreak(checkIns: CheckInRecord[], todayIso: string): number {
  const dates = new Set(checkIns.map((c) => c.date));
  const [y, m, d0] = todayIso.split('-').map(Number);
  const anchor = Date.UTC(y, m - 1, d0);
  let count = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(anchor - i * 86400000).toISOString().slice(0, 10);
    if (dates.has(d)) count++;
    else if (i > 0) break;
  }
  return count;
}

export function painAverageLast7Days(series: number[]): string {
  const recent = series.slice(-7);
  if (!recent.length) return '—';
  const avg = recent.reduce((sum, n) => sum + n, 0) / recent.length;
  return avg.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function progressChartMessage(seriesLength: number): string | null {
  if (seriesLength >= 2) return null;
  return `${INSUFFICIENT_PROGRESS_COPY} (${seriesLength}/2 días). Registra tu bienestar cada día y aquí verás tu evolución.`;
}

export function patientProgress(checkIns: CheckInRecord[], todayIso: string) {
  const series = dailyPainSeries(checkIns);
  return {
    series,
    streak: checkInStreak(checkIns, todayIso),
    painAvg7: painAverageLast7Days(series),
    total: checkIns.length,
    recent: recentCheckIns(checkIns),
    chartMessage: progressChartMessage(series.length),
  };
}
