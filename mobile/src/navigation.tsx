import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { C } from './theme';
import { DashboardScreen } from './screens/DashboardScreen';
import { MembersScreen } from './screens/MembersScreen';
import { MemberDetailScreen } from './screens/MemberDetailScreen';
import { PlansScreen } from './screens/PlansScreen';
import { TeamScreen } from './screens/TeamScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClientesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.cyan,
        headerTitleStyle: { color: C.text },
        contentStyle: { backgroundColor: C.body },
      }}
    >
      <Stack.Screen
        name="MembersList"
        component={MembersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MemberDetail"
        component={MemberDetailScreen}
        options={({ route }: any) => ({ title: route.params?.name || 'Cliente' })}
      />
    </Stack.Navigator>
  );
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid-outline',
  Clientes: 'people-outline',
  Planes: 'pricetags-outline',
  Equipo: 'shield-outline',
  Perfil: 'person-outline',
};

export function MainTabs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.line,
        },
        tabBarActiveTintColor: C.cyan,
        tabBarInactiveTintColor: C.textFaint,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clientes" component={ClientesStack} />
      <Tab.Screen name="Planes" component={PlansScreen} />
      {isAdmin && <Tab.Screen name="Equipo" component={TeamScreen} />}
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
