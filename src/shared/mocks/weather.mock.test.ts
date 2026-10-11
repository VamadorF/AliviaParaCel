import { describe, expect, it } from 'vitest';
import { MOCK_WEATHER, weatherSnapshotForCommune } from './weather.mock';

describe('weather.mock', () => {
  it('tiene pronóstico de 5 días', () => {
    expect(MOCK_WEATHER.forecast).toHaveLength(5);
  });

  it('MOB-27 · genera snapshot por comuna', () => {
    expect(weatherSnapshotForCommune('Santiago', '2026-10-10T08:00:00.000Z')).toMatchObject({
      commune: 'Santiago',
      temperature: 22,
      condition: 'soleado',
    });
  });
});
