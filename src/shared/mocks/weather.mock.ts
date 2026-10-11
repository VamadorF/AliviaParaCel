/**
 * Datos de clima ficticios — reemplaza por tu API real cuando conectes backend.
 */
export type MockForecastDay = {
  id: string;
  label: string;
  tempMin: number;
  tempMax: number;
  condition: 'soleado' | 'nublado' | 'lluvia' | 'tormenta';
};

export type MockWeather = {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windKmh: number;
  condition: MockForecastDay['condition'];
  updatedAt: string;
  forecast: MockForecastDay[];
};

export const MOCK_WEATHER: MockWeather = {
  city: 'Santiago',
  country: 'CL',
  temperature: 22,
  feelsLike: 21,
  humidity: 48,
  windKmh: 12,
  condition: 'soleado',
  updatedAt: '2026-06-01T10:00:00',
  forecast: [
    { id: 'd1', label: 'Hoy', tempMin: 14, tempMax: 24, condition: 'soleado' },
    { id: 'd2', label: 'Mar', tempMin: 13, tempMax: 22, condition: 'nublado' },
    { id: 'd3', label: 'Mié', tempMin: 11, tempMax: 18, condition: 'lluvia' },
    { id: 'd4', label: 'Jue', tempMin: 10, tempMax: 17, condition: 'lluvia' },
    { id: 'd5', label: 'Vie', tempMin: 12, tempMax: 20, condition: 'nublado' },
  ],
};

/** MOB-27 · Clima ficticio por comuna (sin GPS). */
export const MOCK_WEATHER_BY_COMMUNE: Record<string, MockWeather> = {
  Santiago: MOCK_WEATHER,
  Valparaíso: {
    city: 'Valparaíso',
    country: 'CL',
    temperature: 18,
    feelsLike: 17,
    humidity: 62,
    windKmh: 22,
    condition: 'nublado',
    updatedAt: '2026-06-01T10:00:00',
    forecast: MOCK_WEATHER.forecast,
  },
};

export type CheckInWeatherSnapshot = {
  commune: string;
  temperature: number;
  condition: MockForecastDay['condition'];
  /** ISO 8601 del instante en que se capturó con el check-in. */
  capturedAt: string;
};

function normalizeCommuneKey(commune: string): string {
  const trimmed = commune.trim();
  if (!trimmed) return 'Santiago';
  const hit = Object.keys(MOCK_WEATHER_BY_COMMUNE).find(
    (key) => key.toLowerCase() === trimmed.toLowerCase(),
  );
  return hit ?? 'Santiago';
}

/** Instantánea ligera para guardar en cada check-in. */
export function weatherSnapshotForCommune(commune: string, capturedAt: string): CheckInWeatherSnapshot {
  const key = normalizeCommuneKey(commune);
  const source = MOCK_WEATHER_BY_COMMUNE[key] ?? MOCK_WEATHER;
  return {
    commune: source.city,
    temperature: source.temperature,
    condition: source.condition,
    capturedAt,
  };
}
