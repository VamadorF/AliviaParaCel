import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { painColor } from '@/features/patient/utils/pain';

/** Caras EVA del check-in de AlivIACare (0, 2, 4, 6, 8, 10). */
export const EVA_FACES = [
  { num: 0, mouth: 'M15 30 Q24 39 33 30', label: 'Sin dolor' },
  { num: 2, mouth: 'M15 31 Q24 36 33 31', label: 'Dolor leve' },
  { num: 4, mouth: 'M16 32 L32 32', label: 'Dolor moderado' },
  { num: 6, mouth: 'M15 34 Q24 31 33 34', label: 'Dolor intenso' },
  { num: 8, mouth: 'M15 35 Q24 29 33 35', label: 'Dolor muy intenso' },
  { num: 10, mouth: 'M15 36 Q24 28 33 36', label: 'El peor dolor' },
] as const;

export function faceForPain(value: number) {
  return EVA_FACES[Math.min(EVA_FACES.length - 1, Math.round(value / 2))];
}

export function PainFace({
  value,
  size = 72,
  color,
}: {
  value: number;
  size?: number;
  color?: string;
}) {
  const face = faceForPain(value);
  const stroke = color ?? painColor(value);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      <Circle cx="24" cy="24" r="21" fill="none" stroke={stroke} strokeWidth={3} />
      <Circle cx="16.5" cy="19" r="2.6" fill={stroke} />
      <Circle cx="31.5" cy="19" r="2.6" fill={stroke} />
      <Path d={face.mouth} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
