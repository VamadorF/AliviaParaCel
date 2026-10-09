import { describe, expect, it } from 'vitest';
import { MOCK_WEATHER } from './weather.mock';

describe('weather.mock', () => {
  it('tiene pronóstico de 5 días', () => {
    expect(MOCK_WEATHER.forecast).toHaveLength(5);
  });
});
