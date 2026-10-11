import type { CheckInRecord } from '@/features/patient/types';
import { formatCheckInWeather } from '@/features/patient/utils/checkin-weather';
import { painDescriptorLabel } from '@/features/patient/utils/pain-descriptors';

export function painDescriptorLine(record: CheckInRecord): string | null {
  if (!record.painDescriptors?.length) return null;
  return record.painDescriptors.map(painDescriptorLabel).join(' · ');
}

/** Subtítulo secundario bajo fecha/zonas en Diario y Progreso. */
export function checkInSecondaryLine(record: CheckInRecord): string | null {
  const parts = [
    painDescriptorLine(record),
    formatCheckInWeather(record.weatherAtCapture),
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}
