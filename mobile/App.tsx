import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { MainTabs } from './src/navigation';
import { Loading } from './src/ui';
import { ErrorBoundary } from './src/ErrorBoundary';
import { C } from './src/theme';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.body },
};

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <LoginScreen />;
  return (
    <NavigationContainer theme={navTheme}>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.body} />
      <ErrorBoundary>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
