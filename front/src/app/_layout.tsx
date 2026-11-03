import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { inicializarBanco } from '../services/lembretes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export default function Layout() {
  return (

    // Envolve toda a aplicação com o provedor do banco de dados
    <SQLiteProvider databaseName="medicamentos_v2.db" onInit={inicializarBanco}>
      <Stack
        screenOptions={{ headerShown: false }}
      >
      </Stack>
    </SQLiteProvider>
  );
}
