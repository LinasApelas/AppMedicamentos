import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export default function Layout() {
  return <AuthProvider><SessionRoutes /></AuthProvider>;
}

function SessionRoutes() {
  const { user, restoring } = useAuth();
  if (restoring) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={!!user}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="Perfil" options={{ headerShown: true, title: 'Meu perfil', headerTintColor: '#12323A', headerShadowVisible: false, headerStyle: { backgroundColor: '#ffffff' } }} />
    </Stack.Protected>
    <Stack.Protected guard={!user}>
      <Stack.Screen name="login" />
      <Stack.Screen name="CriarConta" />
      <Stack.Screen name="RecuperarSenha" />
      <Stack.Screen name="RecuperarSenhaCodigo" />
      <Stack.Screen name="RecuperarSenhaEmail" />
    </Stack.Protected>
    <Stack.Screen name="index" />
    <Stack.Screen name="termos" />
  </Stack>;
}
