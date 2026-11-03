import { Tabs, Stack } from 'expo-router';
import TabBar from '../../components/TabBar';

export default function Layout() {
  return <>
    <Stack.Screen options={{ headerShown: false }} />
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{
      headerShown: true,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: '#ffffff' },
      headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#12323A' },
    }}>
      <Tabs.Screen name="Lembretes" options={{ title: 'Lembretes' }} />
      <Tabs.Screen name="Adicionar" options={{ title: 'Adicionar' }} />
      <Tabs.Screen name="Perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  </>;
}
