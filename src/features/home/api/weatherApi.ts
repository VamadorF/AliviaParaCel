import { API_URL } from '@/app/config/env';
import { MOCK_WEATHER, type MockWeather } from '@/shared/mocks/weather.mock';

const MOCK_DELAY_MS = 600;

/**
 * Simula una llamada HTTP. Cuando tengas backend real, reemplaza el cuerpo
 * por fetch(`${API_URL}/weather?city=...`) y mapea la respuesta.
 */
export async function fetchWeatherMock(): Promise<MockWeather> {
  void API_URL; // referencia para cuando conectes API real
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return { ...MOCK_WEATHER };
}
