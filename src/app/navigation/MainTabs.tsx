import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DiarioNavigator } from '@/app/navigation/DiarioNavigator';
import { AliviaScreen } from '@/features/patient/screens/AliviaScreen';
import { ComunidadScreen } from '@/features/patient/screens/ComunidadScreen';
import { PatientProfileScreen } from '@/features/patient/screens/PatientProfileScreen';
import { AppIcon, type IconName } from '@/shared/icons/AppIcon';
import type { MainTabParamList } from '@/shared/types/navigation';
import { useTheme } from '@/shared/theme/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: IconName) {
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <AppIcon name={name} color={color} size={size} />;
  }
  TabIcon.displayName = `TabIcon(${name})`;
  return TabIcon;
}

export function MainTabs() {
  const { palette } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          minHeight: 56,
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Diario"
        component={DiarioNavigator}
        options={{ title: 'Diario', headerShown: false, tabBarIcon: tabIcon('book') }}
      />
      <Tab.Screen
        name="AlivIA"
        component={AliviaScreen}
        options={{ title: 'AlivIA', headerShown: false, tabBarIcon: tabIcon('chat') }}
      />
      <Tab.Screen
        name="Comunidad"
        component={ComunidadScreen}
        options={{ title: 'Comunidad', headerShown: false, tabBarIcon: tabIcon('people') }}
      />
      <Tab.Screen
        name="Perfil"
        component={PatientProfileScreen}
        options={{ title: 'Perfil', headerShown: false, tabBarIcon: tabIcon('person') }}
      />
    </Tab.Navigator>
  );
}
