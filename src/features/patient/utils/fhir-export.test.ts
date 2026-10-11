import { describe, expect, it } from 'vitest';
import { painObservationsForExport } from '@/features/patient/utils/fhir-export';
import type { CheckInRecord } from '@/features/patient/types';

describe('PAC-17 · FHIR descriptores', () => {
  it('incluye component por descriptor', () => {
    const record: CheckInRecord = {
      id: 'c1',
      date: '2026-10-10',
      time: '10:00',
      pain: 6,
      zones: ['Lumbar'],
      painDescriptors: ['punzante', 'opresivo'],
      emergency: false,
      registrant: 'self',
      doses: [],
      createdAt: '2026-10-10T10:00:00.000Z',
    };
    const [obs] = painObservationsForExport([record]);
    expect(obs.component).toHaveLength(2);
    expect(obs.component?.[0].valueCodeableConcept.text).toBe('Punzante');
    expect(obs.component?.[0].valueCodeableConcept.coding[0].system).toBe('http://snomed.info/sct');
  });
});
