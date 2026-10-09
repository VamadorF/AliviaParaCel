import React, { useId, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';
import { painColor } from '@/features/patient/utils/pain';

export function dailyPainSeries(checkIns: { date: string; pain: number }[]): number[] {
  const byDay = new Map<string, number[]>();
  for (const entry of checkIns) {
    const list = byDay.get(entry.date) ?? [];
    list.push(entry.pain);
    byDay.set(entry.date, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, pains]) => pains.reduce((sum, n) => sum + n, 0) / pains.length);
}

const LEGEND = [
  { color: '#256e4d', label: 'Controlado (0–3)' },
  { color: '#e08a2f', label: 'Moderado (4–6)' },
  { color: '#b03a44', label: 'Alto (7–10)' },
];

type PainChartProps = {
  values: number[];
  height?: number;
  gridColor?: string;
  labelColor?: string;
};

/** Curva de evolución del dolor: área de AlivIACare + puntos por intensidad. */
export function PainChart({
  values,
  height = 168,
  gridColor = '#e7ebe7',
  labelColor = '#8a9790',
}: PainChartProps) {
  const [width, setWidth] = useState(0);
  const gradId = useId().replace(/:/g, '');

  if (values.length < 2) {
    return (
      <Text style={{ color: labelColor, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
        Tu curva de evolución aparecerá cuando acumules registros diarios.
      </Text>
    );
  }

  const padLeft = 22;
  const padRight = 10;
  const padTop = 14;
  const padBottom = 10;
  const innerW = Math.max(1, width - padLeft - padRight);
  const innerH = height - padTop - padBottom;
  const xAt = (index: number) =>
    padLeft + (values.length === 1 ? innerW / 2 : (index / (values.length - 1)) * innerW);
  const yAt = (pain: number) => padTop + (1 - Math.min(10, Math.max(0, pain)) / 10) * innerH;
  const line = values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  const area = `${line} ${xAt(values.length - 1).toFixed(1)},${yAt(0).toFixed(1)} ${xAt(0).toFixed(1)},${yAt(0).toFixed(1)}`;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height} accessible={false}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2f8f63" stopOpacity={0.22} />
              <Stop offset="1" stopColor="#2f8f63" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {[10, 5, 0].map((tick) => (
            <Line
              key={tick}
              x1={padLeft}
              y1={yAt(tick)}
              x2={width - padRight}
              y2={yAt(tick)}
              stroke={gridColor}
              strokeWidth={1}
            />
          ))}
          <Polygon points={area} fill={`url(#${gradId})`} />
          <Polyline
            points={line}
            fill="none"
            stroke="#2f8f63"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {values.map((value, index) => {
            const last = index === values.length - 1;
            return (
              <Circle
                key={`${index}-${value}`}
                cx={xAt(index)}
                cy={yAt(value)}
                r={last ? 5.5 : 4}
                fill={painColor(value)}
                stroke="#ffffff"
                strokeWidth={last ? 2 : 1.5}
              />
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: labelColor }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '700' },
});
