import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'book'
  | 'chat'
  | 'people'
  | 'person'
  | 'calendar'
  | 'spark'
  | 'warn'
  | 'shield'
  | 'send'
  | 'lock'
  | 'heart'
  | 'pill'
  | 'close';

type AppIconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const strokeProps = (color: string, strokeWidth: number) => ({
  fill: 'none' as const,
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** Iconos de línea extraídos de las pantallas de paciente de AlivIACare. */
export function AppIcon({ name, size = 22, color = '#256e4d', strokeWidth = 2 }: AppIconProps) {
  const s = strokeProps(color, strokeWidth);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === 'book' ? (
        <>
          <Path d="M4 4h13a3 3 0 013 3v13H7a3 3 0 01-3-3z" {...s} />
          <Path d="M8 8h8M8 12h6" {...s} />
        </>
      ) : null}
      {name === 'chat' ? <Path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z" {...s} /> : null}
      {name === 'people' ? (
        <>
          <Circle cx="9" cy="8" r="3.2" {...s} />
          <Path d="M3.5 20a5.5 5.5 0 0111 0" {...s} />
          <Path d="M16 6.5a3 3 0 010 5.6M18 20a5 5 0 00-3-4.6" {...s} />
        </>
      ) : null}
      {name === 'person' ? (
        <>
          <Circle cx="12" cy="8" r="3.5" {...s} />
          <Path d="M5 20a7 7 0 0114 0" {...s} />
        </>
      ) : null}
      {name === 'calendar' ? (
        <>
          <Rect x="3" y="4.5" width="18" height="16" rx="2.5" {...s} />
          <Path d="M3 9h18M8 3v3M16 3v3" {...s} />
        </>
      ) : null}
      {name === 'spark' ? (
        <Path d="M12 3l1.9 4.4L18 9l-4.1 1.6L12 15l-1.9-4.4L6 9l4.1-1.6z" fill={color} />
      ) : null}
      {name === 'warn' ? (
        <>
          <Path d="M12 9v4M12 17h.01" {...s} />
          <Path d="M10.3 4.7h3.4L21 19H3L10.3 4.7z" {...s} />
        </>
      ) : null}
      {name === 'shield' ? <Path d="M12 3l8 3v6c0 4.5-3.5 7.5-8 9-4.5-1.5-8-4.5-8-9V6z" {...s} /> : null}
      {name === 'send' ? <Path d="M4 12l16-8-6 16-3-6-7-2z" {...s} /> : null}
      {name === 'lock' ? (
        <>
          <Rect x="4" y="10" width="16" height="10" rx="2.5" {...s} />
          <Path d="M8 10V7a4 4 0 018 0v3" {...s} />
        </>
      ) : null}
      {name === 'heart' ? (
        <Path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z" {...s} />
      ) : null}
      {name === 'pill' ? (
        <Rect
          x="3"
          y="9"
          width="12"
          height="7"
          rx="3.5"
          transform="rotate(-45 9 12.5)"
          {...s}
        />
      ) : null}
      {name === 'close' ? <Path d="M6 6l12 12M18 6L6 18" {...s} /> : null}
    </Svg>
  );
}

export function IconTile({
  name,
  color,
  background,
  size = 44,
  iconSize,
  shape = 'rounded',
}: {
  name: IconName;
  color: string;
  background: string;
  size?: number;
  iconSize?: number;
  shape?: 'rounded' | 'circle';
}) {
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? size / 2 : Math.round(size * 0.28),
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name={name} size={iconSize ?? Math.round(size * 0.46)} color={color} />
    </View>
  );
}
