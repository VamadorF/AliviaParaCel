import { useQuery } from '@tanstack/react-query';
import { fetchWeatherMock } from '@/features/home/api/weatherApi';

export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'mock'],
    queryFn: fetchWeatherMock,
  });
}
