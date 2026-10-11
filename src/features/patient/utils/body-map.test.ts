import { describe, expect, it } from 'vitest';
import {
  fhirBodySite,
  formatPainSite,
  togglePainSite,
  zonesFromPainSites,
} from '@/features/patient/utils/body-map';

describe('PAC-16 · mapa corporal', () => {
  it('formatea la zona con lateralidad y vista', () => {
    expect(
      formatPainSite({ region: 'lumbar', view: 'back', side: 'izquierdo' }),
    ).toBe('Lumbar (izquierdo, posterior)');
  });

  it('alterna selección por región, vista y lado', () => {
    const site = { region: 'rodilla', view: 'front' as const, side: 'derecho' as const };
    const added = togglePainSite([], site);
    expect(added).toHaveLength(1);
    expect(togglePainSite(added, site)).toHaveLength(0);
  });

  it('exporta bodySite FHIR con lateralidad', () => {
    const bodySite = fhirBodySite({ region: 'hombro', view: 'front', side: 'derecho' });
    expect(bodySite.coding[0].code).toBe('right');
    expect(bodySite.text).toContain('derecho');
  });

  it('genera etiquetas de zona para registros antiguos', () => {
    expect(zonesFromPainSites([{ region: 'cadera', view: 'back', side: 'bilateral' }])).toEqual([
      'Cadera (bilateral, posterior)',
    ]);
  });
});
