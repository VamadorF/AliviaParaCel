import { describe, expect, it } from 'vitest';
import { CLEAN_BOOTSTRAP, DEMO_BOOTSTRAP } from '@/shared/mocks/patient.mock';
import { EMERGENCY_TEL, centerPhoneOf, telHref } from '@/features/patient/utils/crisis';

describe('MOB-19 · teléfono del centro', () => {
  it('devuelve el teléfono cuando la clínica del paciente lo trae', () => {
    expect(centerPhoneOf({ phone: '+56 2 2555 0100' })).toBe('+56 2 2555 0100');
    expect(centerPhoneOf(DEMO_BOOTSTRAP.clinic)).toBe('+56 2 2555 0100');
  });

  it('no devuelve teléfono si no hay clínica o el teléfono está vacío', () => {
    expect(centerPhoneOf(undefined)).toBeNull();
    expect(centerPhoneOf(null)).toBeNull();
    expect(centerPhoneOf({})).toBeNull();
    expect(centerPhoneOf({ phone: null })).toBeNull();
    expect(centerPhoneOf({ phone: '   ' })).toBeNull();
    expect(centerPhoneOf(CLEAN_BOOTSTRAP.clinic)).toBeNull();
  });

  it('arma el marcador del 131 y del centro', () => {
    expect(EMERGENCY_TEL).toBe('131');
    expect(telHref(EMERGENCY_TEL)).toBe('tel:131');
    expect(telHref('+56 2 2555 0100')).toBe('tel:+56225550100');
  });
});
