import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/shared/components/Chip';
import {
  BODY_REGIONS,
  formatPainSite,
  regionsForView,
  togglePainSite,
  type BodyLaterality,
  type BodyView,
  type PainSite,
} from '@/features/patient/utils/body-map';
import { useTheme } from '@/shared/theme/ThemeContext';

const SIDES: BodyLaterality[] = ['izquierdo', 'derecho', 'bilateral'];

type BodyMapPickerProps = {
  value: PainSite[];
  onChange: (sites: PainSite[]) => void;
};

export function BodyMapPicker({ value, onChange }: BodyMapPickerProps) {
  const { palette } = useTheme();
  const [view, setView] = useState<BodyView>('front');
  const [pendingRegion, setPendingRegion] = useState<string | null>(null);
  const regions = regionsForView(view);

  const pickSide = (region: string, side: BodyLaterality) => {
    onChange(togglePainSite(value, { region, view, side }));
    setPendingRegion(null);
  };

  return (
    <View>
      <View style={styles.row}>
        {(['front', 'back'] as const).map((v) => (
          <Chip
            key={v}
            label={v === 'front' ? 'Vista frontal' : 'Vista posterior'}
            selected={view === v}
            onPress={() => {
              setView(v);
              setPendingRegion(null);
            }}
          />
        ))}
      </View>
      <Text style={[styles.hint, { color: palette.textMuted }]}>
        Toca una zona y elige el lado. También puedes usar la lista inferior (lector de pantalla).
      </Text>
      <View style={styles.grid} accessibilityRole="none">
        {regions.map((region) => {
          const active = value.some((s) => s.region === region.id && s.view === view);
          return (
            <Pressable
              key={`${view}-${region.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Zona ${region.label}, vista ${view === 'front' ? 'frontal' : 'posterior'}`}
              accessibilityState={{ selected: active }}
              onPress={() => setPendingRegion(region.id)}
              style={[
                styles.cell,
                {
                  borderColor: active ? palette.primary : palette.border,
                  backgroundColor: active ? palette.primarySoft : palette.surface,
                },
              ]}
            >
              <Text style={{ color: palette.text, fontWeight: '700', fontSize: 13 }}>{region.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {pendingRegion ? (
        <View style={styles.sideRow}>
          <Text style={[styles.label, { color: palette.text }]}>Lateralidad</Text>
          {SIDES.map((side) => (
            <Chip
              key={side}
              label={side.charAt(0).toUpperCase() + side.slice(1)}
              selected={false}
              onPress={() => pickSide(pendingRegion, side)}
            />
          ))}
        </View>
      ) : null}
      <Text
        accessibilityRole="header"
        style={[styles.label, { color: palette.text, marginTop: 16 }]}
      >
        Lista de zonas (alternativa accesible)
      </Text>
      {BODY_REGIONS.map((region) => (
        <View key={region.id} style={styles.listRow}>
          <Text style={{ color: palette.text, fontWeight: '700', flex: 1 }}>{region.label}</Text>
          <View style={styles.row}>
            {SIDES.map((side) => {
              const site = { region: region.id, view: region.front ? 'front' : 'back', side } as PainSite;
              const selected = value.some((s) => formatPainSite(s) === formatPainSite(site));
              return (
                <Chip
                  key={`${region.id}-${side}`}
                  label={side === 'bilateral' ? 'Bi' : side === 'izquierdo' ? 'Izq' : 'Der'}
                  selected={selected}
                  accessibilityLabel={`${region.label}, ${side}`}
                  onPress={() => onChange(togglePainSite(value, site))}
                />
              );
            })}
          </View>
        </View>
      ))}
      {value.length > 0 ? (
        <Text style={{ color: palette.textMuted, marginTop: 8, lineHeight: 20 }}>
          Seleccionadas: {value.map(formatPainSite).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  sideRow: { marginTop: 10, gap: 8 },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    minWidth: '30%',
    flexGrow: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
});
