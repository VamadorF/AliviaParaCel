import { describe, expect, it } from 'vitest';
import type { Medication } from '@/features/patient/types';
import {
  buildCheckInRecord,
  initialDraft,
  type CheckinDraft,
} from '@/features/patient/utils/checkin';
import {
  PAIN_DESCRIPTOR_IDS,
  sanitizePainDescriptors,
  togglePainDescriptor,
} from '@/features/patient/utils/pain-descriptors';

const med: Medication = {
  id: 'm1',
  name: 'Paracetamol',
  concentration: '500 mg',
  form: 'Comprimido',
  quantity: '1',
  route: 'Oral',
  frequency: '8 h',
  duration: '30 d',
  status: 'activo',
};

function draftOf(patch: Partial<CheckinDraft> = {}): CheckinDraft {
  return { ...initialDraft([med], null), emergency: false, registrant: 'self', ...patch };
}

describe('PAC-17 · descriptores del dolor', () => {
  it('alterna chips y filtra ids válidos', () => {
    let sel: string[] = [];
    sel = togglePainDescriptor(sel, 'punzante');
    sel = togglePainDescriptor(sel, 'quemante');
    expect(sanitizePainDescriptors(sel)).toEqual(['punzante', 'quemante']);
    sel = togglePainDescriptor(sel, 'punzante');
    expect(sanitizePainDescriptors(sel)).toEqual(['quemante']);
  });

  it('guarda descriptores en el registro', () => {
    const draft = draftOf({ painDescriptorSel: [...PAIN_DESCRIPTOR_IDS] });
    const record = buildCheckInRecord(draft, [med], new Date('2026-10-10T12:00:00.000Z'), 'x')!;
    expect(record.painDescriptors).toEqual([...PAIN_DESCRIPTOR_IDS]);
  });
});
