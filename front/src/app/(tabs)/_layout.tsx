import AlarmeMedicamento from '../../components/AlarmeMedicamento';
import { Tabs, Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import TabBar from '../../components/TabBar';
import MenuConta from '../../components/MenuConta';
import { useAuth } from '../../contexts/AuthContext';
import { inicializarBanco } from '../../services/lembretes';
import { atualizarAlarmes, cancelarTodosAlarmes } from '../../services/alarmes';
import { type Remedio } from '../../services/agenda';
import { capturarSessaoLocal, sessaoLocalAtual, validarSessaoLocal } from '../../services/sessaoLocal';

export default function Layout() {
  const { user, restoring, sessionVersion } = useAuth();
  const usuarioId = user?.id ?? 0;
  const iniciarBanco = useCallback(async (db: SQLiteDatabase) => {
    const sessao = capturarSessaoLocal();
    if (sessao.usuarioId !== usuarioId) throw new Error('A sessão mudou.');
    await cancelarTodosAlarmes();
    validarSessaoLocal(sessao);
    await inicializarBanco(db);
    validarSessaoLocal(sessao);
    const items = await db.getAllAsync<Remedio>('SELECT * FROM lembretes');
    validarSessaoLocal(sessao);
    try { await atualizarAlarmes(items, false, sessao, db); }
    catch {
      if (sessaoLocalAtual(sessao)) Alert.alert('Aviso', 'Não foi possível restaurar os alarmes. Abra os lembretes para tentar novamente.');
    }
  }, [usuarioId]);
  if (restoring) return null;
  return <SQLiteProvider key={`${usuarioId}:${sessionVersion}`} databaseName={usuarioId === 0 ? 'medicamentos_visitante.db' : `medicamentos_usuario_${usuarioId}.db`} onInit={iniciarBanco}>
    <AlarmeMedicamento />
    <Stack.Screen options={{ headerShown: false }} />
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{
      headerShown: true,
      headerRight: () => <MenuConta />,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: '#ffffff' },
      headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#12323A' },
    }}>
      <Tabs.Screen name="Lembretes" options={{ title: 'Lembretes' }} />
      <Tabs.Screen name="Adicionar" options={{ title: 'Adicionar' }} />
      <Tabs.Screen name="Farmacias" options={{ title: 'Farmácias próximas' }} />
    </Tabs>
  </SQLiteProvider>;
}
