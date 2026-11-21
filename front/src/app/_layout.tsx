import { telaAlarmeDisponivel } from '../services/alertaPrimeiroPlano';
import { apiService } from '../services/api';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const data = notification.request.content.data;
    const autorizado = data?.syncmed !== true || data?.usuarioId === (apiService.currentUser?.id ?? 0);
    // Android also suppresses heads-up/vibration when shouldPlaySound is false.
    // Keep the OS alert even if foreground audio subsequently fails to load.
    return { shouldShowBanner: autorizado, shouldShowList: autorizado, shouldPlaySound: autorizado && !(Platform.OS !== 'android' && data?.nivelAviso === 'ALARME' && AppState.currentState === 'active' && telaAlarmeDisponivel()), shouldSetBadge: false };
  },
});

export default function Layout() {
  return <AuthProvider><SessionRoutes /></AuthProvider>;
}

function SessionRoutes() {
  const { user, restoring } = useAuth();
  if (restoring) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Protected guard={!!user}>
      <Stack.Screen name="Perfil" options={{ headerShown: true, title: 'Meu perfil', headerBackTitle: 'Voltar', headerBackButtonDisplayMode: 'default', headerTintColor: '#12323A', headerShadowVisible: false, headerStyle: { backgroundColor: '#ffffff' } }} />
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
