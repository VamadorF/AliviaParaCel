import { describe, expect, it } from 'vitest';
import { attachWeatherToCheckIn, patientCommune } from '@/features/patient/utils/checkin-weather';
import type { CheckInRecord, PatientBootstrap } from '@/features/patient/types';

describe('MOB-27 · clima en check-in', () => {
  it('adjunta snapshot mock según comuna del paciente', () => {
    const data = { commune: 'Valparaíso' } as PatientBootstrap;
    const record: CheckInRecord = {
      id: 'c1',
      date: '2026-10-10',
      time: '10:00',
      pain: 4,
      zones: ['Lumbar'],
      emergency: false,
      registrant: 'self',
      doses: [],
      createdAt: '2026-10-10T10:00:00.000Z',
    };
    const next = attachWeatherToCheckIn(record, data);
    expect(next.weatherAtCapture).toMatchObject({
      commune: 'Valparaíso',
      temperature: 18,
      condition: 'nublado',
      capturedAt: '2026-10-10T10:00:00.000Z',
    });
  });

  it('usa Santiago si no hay comuna', () => {
    expect(patientCommune({ commune: null })).toBe('Santiago');
  });
});
