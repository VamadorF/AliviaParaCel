import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/ThemeContext';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
} & Pick<ScrollViewProps, 'refreshControl'>;

export function Screen({
  children,
  scroll = true,
  contentStyle,
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const containerStyle = [
    styles.container,
    {
      paddingTop: insets.top + 8,
      paddingBottom: insets.bottom + 16,
      backgroundColor: palette.background,
    },
    contentStyle,
  ];

  if (!scroll) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={containerStyle}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
});
