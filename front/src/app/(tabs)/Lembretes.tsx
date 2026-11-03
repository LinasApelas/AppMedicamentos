import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import Calendario from '../../components/Calendario';
import Button from '../../components/Button';
import { dataLocal, horario, horariosDoDia, lerData, type Remedio } from '../../services/agenda';
import { sincronizarLembretes } from '../../services/lembretes';
import { atualizarAlarmes, cancelarAlarmes } from '../../services/alarmes';
import { apiService } from '../../services/api';

export default function Lembretes() {
  const db = useSQLiteContext();
  const [selectedDate, setSelectedDate] = useState(dataLocal());
  const [remedios, setRemedios] = useState<Remedio[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setRemedios(await db.getAllAsync<Remedio>('SELECT * FROM lembretes ORDER BY nome'));
      try { await sincronizarLembretes(db); setSyncError(false); }
      catch { setSyncError(true); }
      const items = await db.getAllAsync<Remedio>('SELECT * FROM lembretes ORDER BY nome');
      setRemedios(items);
      await atualizarAlarmes(items).catch(error => console.warn('Alarmes pendentes:', error));
    } catch { Alert.alert('Erro', 'Não foi possível carregar os medicamentos.'); }
    finally { setLoading(false); }
  }, [db]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const excluir = (item: Remedio) => Alert.alert('Excluir medicamento?', `Excluir ${item.nome} e seus alarmes?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      try {
        if (item.serverId) await apiService.deletarMedicamento(item.serverId);
        await cancelarAlarmes(item.id);
        await db.runAsync('DELETE FROM lembretes WHERE id = ?', [item.id]);
        await carregar();
      } catch { Alert.alert('Erro', 'Não foi possível excluir. Verifique a conexão e tente novamente.'); }
    } },
  ]);
  const programados = remedios.map(item => ({ item, doses: horariosDoDia(item, selectedDate) }))
    .filter(entry => entry.doses.length > 0).sort((a, b) => a.doses[0].getTime() - b.doses[0].getTime());
  const lista = mostrarTodos ? remedios.map(item => ({ item, doses: horariosDoDia(item, selectedDate) })) : programados;
  const semAgenda = remedios.filter(item => !lerData(item.inicio || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.dose || '') || !item.intervalo || !item.frequencia).length;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.container}
    refreshControl={<RefreshControl refreshing={loading} onRefresh={carregar} />}>
    <View style={styles.welcome}><Text style={styles.title}>Sua rotina de cuidados</Text><Text style={styles.text}>Selecione um dia para ver os horários programados.</Text></View>
    <Calendario selectedDate={selectedDate} onDateSelected={date => { setSelectedDate(date); setMostrarTodos(false); }}
      hasSchedule={date => remedios.some(item => horariosDoDia(item, date).length > 0)} />
    <View style={styles.tabs}>
      <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: !mostrarTodos }} style={[styles.tab, !mostrarTodos && styles.selected]} onPress={() => setMostrarTodos(false)}><Text style={styles.tabText}>Agenda do dia</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: mostrarTodos }} style={[styles.tab, mostrarTodos && styles.selected]} onPress={() => setMostrarTodos(true)}><Text style={styles.tabText}>Todos ({remedios.length})</Text></TouchableOpacity>
    </View>
    <Text style={styles.section}>{mostrarTodos ? 'Medicamentos cadastrados' : `Programado para ${selectedDate.split('-').reverse().join('/')}`}</Text>
    {syncError && <Text style={styles.notice}>Sem conexão com o servidor. Exibindo os dados salvos no aparelho.</Text>}
    {semAgenda > 0 && <Text style={styles.notice}>{semAgenda} cadastro(s) sem programação completa. Abra “Todos” e edite para definir os horários.</Text>}
    {lista.length === 0 && <View style={styles.card}><Text style={styles.text}>{loading ? 'Carregando…' : 'Nenhum medicamento programado para este dia.'}</Text></View>}
    {lista.map(({ item, doses }) => <View key={item.id} style={styles.card}>
      <View style={styles.row}><Text style={styles.name}>{item.nome}</Text>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel={`Editar ${item.nome}`} onPress={() => router.push({ pathname: '/Adicionar', params: { id: item.id } })}><MaterialIcons name="edit" size={22} color="#1a73e8" /></TouchableOpacity>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel={`Excluir ${item.nome}`} onPress={() => excluir(item)}><MaterialIcons name="delete-outline" size={22} color="#c0392b" /></TouchableOpacity>
      </View>
      <Text style={styles.text}>Para: {item.username || 'Você'}</Text>
      <Text style={styles.text}>{item.inicio ? `Início: ${item.inicio.split('-').reverse().join('/')}` : 'Data de início não definida'}</Text>
      <Text style={styles.text}>{item.intervalo ? `A cada ${item.intervalo}h · ${item.frequencia || '?'} dias` : 'Edite para completar a programação'}</Text>
      <View style={styles.times}>{doses.map(date => <Text key={date.getTime()} style={styles.time}>{horario(date)}</Text>)}</View>
      {!doses.length && <Text style={styles.notice}>Sem dose prevista para o dia selecionado.</Text>}
      {!!item.pendente && <Text style={styles.notice}>Sincronização pendente</Text>}
    </View>)}
    <Button titulo="Adicionar medicamento" icon="plus" onPress={() => router.push({ pathname: '/Adicionar', params: { id: '' } })} />
    <Text style={styles.footnote}>Os horários seguem o fuso do aparelho. A fila dos próximos alarmes é renovada ao abrir esta agenda; mantenha as notificações permitidas.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingBottom: 32 },
  welcome: { backgroundColor: '#E6F6F8', padding: 20, borderRadius: 24, marginBottom: 16 },
  title: { fontSize: 24, lineHeight: 30, includeFontPadding: false, fontWeight: '700', color: '#12323A', marginBottom: 8 },
  text: { fontSize: 15, lineHeight: 22, includeFontPadding: false, color: '#52656b', marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  tab: { flex: 1, minHeight: 48, padding: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#f0f4f5' },
  selected: { backgroundColor: '#9DD7E2' },
  tabText: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#12323A', includeFontPadding: false },
  section: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: '#12323A', marginBottom: 12 },
  card: { backgroundColor: '#F7F9F9', borderWidth: 1, borderColor: '#E2F1F8', padding: 16, borderRadius: 20, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, fontSize: 20, lineHeight: 26, includeFontPadding: false, fontWeight: '700', color: '#12323A' },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  time: { fontSize: 16, lineHeight: 22, includeFontPadding: false, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#E2F1F8', color: '#12323A' },
  notice: { fontSize: 14, lineHeight: 20, color: '#80601b', marginBottom: 10, marginTop: 6 },
  footnote: { fontSize: 12, lineHeight: 18, color: '#52656b', marginTop: 16 },
});
