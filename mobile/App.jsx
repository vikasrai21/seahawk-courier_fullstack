// App.jsx — Root of the mobile app
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen      from './src/screens/LoginScreen';
import DashboardScreen  from './src/screens/DashboardScreen';
import ShipmentsScreen  from './src/screens/ShipmentsScreen';
import TrackScreen      from './src/screens/TrackScreen';
import ProfileScreen    from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const COLORS = {
  bg:      '#0a0f1a',
  surface: '#111827',
  border:  '#1f2d45',
  orange:  '#f97316',
  textDim: '#475569',
  text:    '#f1f5f9',
};

// ── Bottom tab icons (text-based, no icon lib needed) ─────────────────────
function tabIcon(name, focused) {
  const icons = { Dashboard: '⬛', Shipments: '📦', Track: '🔍', Profile: '👤' };
  return icons[name] || '•';
}

// ── Main app tabs (shown after login) ────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.border,
          borderTopWidth:  0.5,
          height:          60,
          paddingBottom:   8,
        },
        tabBarActiveTintColor:   COLORS.orange,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  />
      <Tab.Screen name="Shipments"  component={ShipmentsScreen}  />
      <Tab.Screen name="Track"      component={TrackScreen}      />
      <Tab.Screen name="Profile"    component={ProfileScreen}    />
    </Tab.Navigator>
  );
}

// ── Root navigator — switches between auth and main ───────────────────────
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.orange} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

// ── App root ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={COLORS.bg} />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
