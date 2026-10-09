import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWeather } from '@/features/home/hooks/useWeather';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import type { MockForecastDay } from '@/shared/mocks/weather.mock';
import { useTheme } from '@/shared/theme/ThemeContext';

const CONDITION_EMOJI: Record<MockForecastDay['condition'], string> = {
  soleado: '☀️',
  nublado: '☁️',
  lluvia: '🌧️',
  tormenta: '⛈️',
};

export function HomeScreen() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data, isLoading, isFetching, refetch } = useWeather();

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={() => void refetch()}
          tintColor={palette.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.heading, { color: palette.text }]}>
          {t('home.title')}
        </Text>
        <View style={[styles.badge, { backgroundColor: palette.primary }]}>
          <Text style={styles.badgeText}>{t('home.mockBadge')}</Text>
        </View>
      </View>

      {isLoading || !data ? (
        <ActivityIndicator color={palette.primary} style={styles.loader} />
      ) : (
        <>
          <Card>
            <Text style={[styles.city, { color: palette.text }]}>
              {data.city}, {data.country}
            </Text>
            <Text style={[styles.temp, { color: palette.primary }]}>
              {CONDITION_EMOJI[data.condition]} {data.temperature}°
            </Text>
            <Text style={{ color: palette.textMuted }}>
              Sensación {data.feelsLike}° · Humedad {data.humidity}% · Viento{' '}
              {data.windKmh} km/h
            </Text>
          </Card>

          <Text style={[styles.section, { color: palette.text }]}>
            {t('home.forecast')}
          </Text>
          {data.forecast.map((day) => (
            <Card key={day.id}>
              <View style={styles.row}>
                <Text style={[styles.dayLabel, { color: palette.text }]}>
                  {day.label}
                </Text>
                <Text style={{ color: palette.textMuted }}>
                  {CONDITION_EMOJI[day.condition]} {day.tempMin}° / {day.tempMax}
                  °
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heading: { fontSize: 22, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  loader: { marginTop: 40 },
  city: { fontSize: 20, fontWeight: '600' },
  temp: { fontSize: 36, fontWeight: '700', marginVertical: 8 },
  section: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: { fontSize: 16, fontWeight: '500' },
});
