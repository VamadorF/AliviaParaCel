// Generado: no editar

import { normalizeRut } from './rut';
import type { CheckInRow } from './checkin-row';

export interface PainSeriesPoint {
  date: string; offset: number; pain: number; count: number; zones: string[]; mood: string; sleep: string;
  caregivers: { name: string; relation: string }[];
  /** Resumen GI del día (último registro con datos digestivos). */
  giSummary: string | null;
}

export function lastCaregiver(checkInHistory: CheckInRow[], patientRut: string): { name: string; relation: string } | null {
  const me = normalizeRut(patientRut);
  for (let i = checkInHistory.length - 1; i >= 0; i--) {
    const c = checkInHistory[i];
    if (normalizeRut(c.patientRut) !== me) continue;
    if (c.reportedBy === 'cuidador' && c.caregiverName.trim()) {
      return { name: c.caregiverName.trim(), relation: c.caregiverRelation.trim() };
    }
  }
  return null;
}

function giDaySummary(entries: CheckInRow[]): string | null {
  const withGi = [...entries].reverse().find((e) => e.nausea || e.vomiting || e.bowelMovements !== null || (e.giDetail && Object.keys(e.giDetail).length));
  if (!withGi) return null;
  const parts: string[] = [];
  if (withGi.nausea) parts.push('náuseas');
  if (withGi.vomiting) parts.push('vómitos');
  if (withGi.bowelMovements !== null) parts.push(withGi.bowelMovements === 0 ? 'sin deposiciones' : withGi.bowelMovements + ' deposición(es)');
  const appetite = withGi.giDetail?.appetite;
  if (appetite && appetite !== 'normal') parts.push('apetito ' + appetite);
  return parts.length ? parts.join(', ') : null;
}

export function patientPainSeries(checkInHistory: CheckInRow[], rut: string): PainSeriesPoint[] {
  const me = normalizeRut(rut);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 13);
  const byDay = new Map<string, CheckInRow[]>();
  for (const c of checkInHistory) {
    if (normalizeRut(c.patientRut) !== me) continue;
    const created = new Date(c.createdAt);
    if (created < cutoff) continue;
    const day = localDateStr(c.createdAt);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(c);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, entries]) => {
      const offset = Math.round((today.getTime() - new Date(day + 'T00:00:00').getTime()) / 86400000);
      const last = entries[entries.length - 1];
      const caregivers = entries
        .filter((e) => e.reportedBy === 'cuidador' && e.caregiverName.trim())
        .map((e) => ({ name: e.caregiverName.trim(), relation: e.caregiverRelation.trim() }));
      const uniq = caregivers.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name && x.relation === c.relation) === i);
      const giSummary = giDaySummary(entries);
      return {
        date: day, offset, count: entries.length,
        pain: Number((entries.reduce((a, e) => a + e.pain, 0) / entries.length).toFixed(1)),
        zones: last.zones, mood: last.mood, sleep: last.sleep, caregivers: uniq, giSummary,
      };
    });
}

export function patientCheckIns(checkInHistory: CheckInRow[], rut: string): CheckInRow[] {
  const me = normalizeRut(rut);
  return checkInHistory.filter((c) => normalizeRut(c.patientRut) === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function daysSinceLastCheckIn(checkInHistory: CheckInRow[], rut: string): number | null {
  const last = patientCheckIns(checkInHistory, rut)[0];
  if (!last) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - new Date(localDateStr(last.createdAt) + 'T00:00:00').getTime()) / 86400000));
}

export function checkInStreak(checkInHistory: CheckInRow[], rut: string): number {
  const days = new Set(patientCheckIns(checkInHistory, rut).map((c) => localDateStr(c.createdAt)));
  if (days.size === 0) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(localDateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function localDateStr(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function myTodayRecords(todayRecords: CheckInRow[], patientRut: string): CheckInRow[] {
  const me = normalizeRut(patientRut);
  return todayRecords.filter((r) => normalizeRut(r.patientRut) === me);
}
