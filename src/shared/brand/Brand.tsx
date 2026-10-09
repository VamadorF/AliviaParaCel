import React, { useId } from 'react';
import { Text, View, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** Colores del wordmark oficial de AlivIACare. */
export const BRAND = {
  green: '#5DA55E',
  blue: '#6B9FD9',
  greenOnDark: '#8FD1A0',
  blueOnDark: '#9CC3EE',
} as const;

type LogoMarkProps = {
  size?: number;
  /** Color del fondo: el arco se separa de las piernas con ese tono. */
  bg?: string;
};

export function LogoMark({ size = 40, bg = '#ffffff' }: LogoMarkProps) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      accessible={false}
    >
      <Defs>
        <LinearGradient id={`${id}l`} x1="50" y1="10" x2="30" y2="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#8DC85F" />
          <Stop offset="1" stopColor="#2A9D86" />
        </LinearGradient>
        <LinearGradient id={`${id}r`} x1="50" y1="10" x2="74" y2="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#7DBE63" />
          <Stop offset="1" stopColor="#1E93B0" />
        </LinearGradient>
        <LinearGradient id={`${id}s`} x1="22" y1="70" x2="86" y2="44" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#2E8F9A" />
          <Stop offset="1" stopColor="#A6D0EE" />
        </LinearGradient>
      </Defs>
      <Path d="M50 16L23 82" stroke={`url(#${id}l)`} strokeWidth={17} strokeLinecap="round" />
      <Path d="M50 16L75 82" stroke={`url(#${id}r)`} strokeWidth={15} strokeLinecap="round" />
      <Path d="M22 63Q50 82 84 46" stroke={bg} strokeWidth={13} strokeLinecap="round" />
      <Path d="M22 63Q50 82 84 46" stroke={`url(#${id}s)`} strokeWidth={6.5} strokeLinecap="round" />
    </Svg>
  );
}

export function Wordmark({
  fontSize = 20,
  dark = false,
  style,
}: {
  fontSize?: number;
  dark?: boolean;
  style?: TextStyle;
}) {
  return (
    <Text style={[{ fontSize, fontWeight: '800', letterSpacing: -0.4 }, style]}>
      <Text style={{ color: dark ? BRAND.greenOnDark : BRAND.green }}>Aliv</Text>
      <Text style={{ color: dark ? BRAND.blueOnDark : BRAND.blue }}>IA</Text>
    </Text>
  );
}

export function BrandLockup({
  size = 40,
  fontSize = 20,
  dark = false,
  bg,
  style,
}: {
  size?: number;
  fontSize?: number;
  dark?: boolean;
  bg?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <LogoMark size={size} bg={bg} />
      <Wordmark fontSize={fontSize} dark={dark} />
    </View>
  );
}
