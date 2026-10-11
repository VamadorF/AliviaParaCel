import type { PatientBootstrap } from '@/features/patient/types';
import type { CheckInRecord } from '@/features/patient/types';
import {
  weatherSnapshotForCommune,
  type CheckInWeatherSnapshot,
} from '@/shared/mocks/weather.mock';

/** Comuna de la ficha; sin dato usa Santiago (mock). */
export function patientCommune(data: Pick<PatientBootstrap, 'commune'>): string {
  const value = data.commune?.trim();
  return value || 'Santiago';
}

export function attachWeatherToCheckIn(
  record: CheckInRecord,
  data: Pick<PatientBootstrap, 'commune'>,
): CheckInRecord {
  if (record.weatherAtCapture) return record;
  const capturedAt = record.createdAt ?? `${record.date}T${record.time}:00`;
  const weatherAtCapture: CheckInWeatherSnapshot = weatherSnapshotForCommune(
    patientCommune(data),
    capturedAt,
  );
  return { ...record, weatherAtCapture };
}

const CONDITION_LABEL: Record<CheckInWeatherSnapshot['condition'], string> = {
  soleado: 'soleado',
  nublado: 'nublado',
  lluvia: 'lluvia',
  tormenta: 'tormenta',
};

/** Texto informativo para la ficha (dato de referencia, no pronóstico en vivo). */
export function formatCheckInWeather(snapshot: CheckInWeatherSnapshot | undefined): string | null {
  if (!snapshot) return null;
  return `Clima en ${snapshot.commune}: ${snapshot.temperature}° · ${CONDITION_LABEL[snapshot.condition]} (referencia)`;
}
