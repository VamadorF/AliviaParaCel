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
