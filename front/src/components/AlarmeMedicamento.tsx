import { iniciarAlerta, pararAlerta, prepararTelaAlarme } from '../services/alertaPrimeiroPlano';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Modal, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Button from './Button';
import { type Remedio } from '../services/agenda';
import { chaveDose, revisao, type Ocorrencia } from '../services/alarmes';
import { agirOcorrencia, sincronizarConfirmacoes } from '../services/ocorrencias';
import { capturarSessaoLocal, sessaoLocalAtual } from '../services/sessaoLocal';

type Aviso = { item: Remedio; prevista: number; chave: string };
// One modal/queue for the entire authenticated database, including cold-start responses.
export default function AlarmeMedicamento() {
  const db = useSQLiteContext();
  const [sessao] = useState(capturarSessaoLocal);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const dark = useColorScheme() === 'dark';
  const aviso = avisos[0];
  const [appAtivo, setAppAtivo] = useState(AppState.currentState === 'active');
  const [erroSom, setErroSom] = useState(false);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active') pararAlerta();
      setAppAtivo(state === 'active');
    });
    return () => { listener.remove(); pararAlerta(); };
  }, []);
  useEffect(() => {
    let ativo = true;
    if (aviso && appAtivo && !ocupado && sessaoLocalAtual(sessao)) {
      void iniciarAlerta().then(() => { if (ativo) setErroSom(false); }).catch(() => { if (ativo) { pararAlerta(); setErroSom(true); } });
    }
    return () => { ativo = false; pararAlerta(); };
  }, [aviso, appAtivo, ocupado, sessao]);
  useEffect(() => {
    let ativo = true;
    const receber = async (n: Notifications.Notification, toque: boolean) => {
      const d = n.request.content.data;
      if (!ativo || !sessaoLocalAtual(sessao) || !d || d.syncmed !== true || d.usuarioId !== sessao.usuarioId ||
          d.nivelAviso !== 'ALARME' || typeof d.id !== 'string' || typeof d.prevista !== 'number' ||
          typeof d.disparo !== 'number' || (!toque && AppState.currentState !== 'active')) return;
      const item = await db.getFirstAsync<Remedio>('SELECT * FROM lembretes WHERE id = ?', [d.id]);
      if (!item || item.nivelAviso !== 'ALARME' || d.revisao !== revisao(item)) return;
      const chave = chaveDose(item.id, d.prevista);
      const estado = await db.getFirstAsync<Ocorrencia>('SELECT * FROM ocorrencias WHERE chave = ?', [chave]);
      if (estado && (estado.estado !== 'ADIADO' || estado.adiadaAte !== d.disparo || estado.adiadaAte > Date.now())) return;
      if (ativo && sessaoLocalAtual(sessao)) setAvisos(lista => lista.some(a => a.chave === chave) ? lista : [...lista, { item, prevista: d.prevista as number, chave }]);
    };
    const executar = (n: Notifications.Notification, toque: boolean) => {
      void receber(n, toque).catch(() => { if (ativo) Alert.alert('Aviso', 'Não foi possível abrir este alarme. Abra a agenda.'); });
    };
    const received = Notifications.addNotificationReceivedListener(n => executar(n, false));
    prepararTelaAlarme(true);
    const response = Notifications.addNotificationResponseReceivedListener(r => {
      executar(r.notification, true);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    });
    void Notifications.getLastNotificationResponseAsync().then(r => {
      if (r) { executar(r.notification, true); void Notifications.clearLastNotificationResponseAsync().catch(() => undefined); }
    }).catch(() => undefined);
    return () => { ativo = false; prepararTelaAlarme(false); pararAlerta(); received.remove(); response.remove(); };
  }, [db, sessao]);
  async function agir(estado: Ocorrencia['estado']) {
    if (!aviso || trava.current || !sessaoLocalAtual(sessao)) return;
    trava.current = true; pararAlerta(); setOcupado(true);
    try {
      await agirOcorrencia(db, aviso.item, aviso.prevista, estado, sessao);
      if (sessaoLocalAtual(sessao)) {
        setAvisos(lista => lista.filter(a => a.chave !== aviso.chave));
        if (estado === 'TOMADO') void sincronizarConfirmacoes(db, sessao).catch(() => {
          if (sessaoLocalAtual(sessao)) Alert.alert('Registrado no aparelho', 'A confirmação será sincronizada ao abrir os lembretes com conexão.');
        });
      }
    } catch {
      if (sessaoLocalAtual(sessao)) Alert.alert('Atenção', 'Não foi possível concluir o aviso. Confira as permissões e abra a agenda para restaurar os agendamentos.');
    } finally { trava.current = false; setOcupado(false); }
  }
  const color = dark ? '#E8F7FA' : '#12323A';
  return <Modal visible={!!aviso && sessaoLocalAtual(sessao)} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!ocupado) { pararAlerta(); setAvisos(lista => lista.slice(1)); } }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#112A30' : '#E6F6F8' }}>
      <ScrollView contentContainerStyle={styles.content}>
        <MaterialIcons name="alarm" size={80} color={dark ? '#99D9EA' : '#238399'} />
        <Text accessibilityRole="header" style={[styles.title, { color }]}>Hora do medicamento!</Text>
        <Text style={[styles.name, { color }]}>{aviso?.item.nome}</Text>
        {!!aviso?.item.dosagem && <Text style={[styles.detail, { color }]}>{aviso.item.dosagem}</Text>}
        <Text style={[styles.detail, { color }]}>{aviso && new Date(aviso.prevista).toLocaleString()}</Text>
        <View style={styles.badge}><Text style={{ color: '#12323A', fontWeight: '700' }}>● Aviso ativo{avisos.length > 1 ? ` · +${avisos.length - 1} aguardando` : ''}</Text></View>
        <Text style={[styles.caption, { color }]}>{erroSom ? 'Não foi possível reproduzir o som. O aviso continua ativo; confira se seu aplicativo está atualizado.' : 'Som conforme o volume e o modo silencioso do aparelho.'}</Text>
        <View style={styles.actions}>
          <Button titulo="Já tomei" icon="check" disabled={ocupado} loading={ocupado} onPress={() => void agir('TOMADO')} />
          <Button titulo="Adiar 5 minutos" icon="clock" corFundo="#CCE9EF" disabled={ocupado} onPress={() => void agir('ADIADO')} />
          <Button titulo="Dispensar" corFundo="#E2F1F8" disabled={ocupado} onPress={() => void agir('DISPENSADO')} />
          <Text style={[styles.caption, { color }]}>Dispensar fecha este aviso sem registrar a medicação como tomada. Os próximos horários são mantidos.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, width: '100%', maxWidth: 560, alignSelf: 'center', gap: 18 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  name: { fontSize: 34, fontWeight: '700', textAlign: 'center' },
  detail: { fontSize: 20, textAlign: 'center' },
  badge: { backgroundColor: '#99D9EA', borderRadius: 20, padding: 12 },
  actions: { width: '100%', gap: 14, marginTop: 20 },
  caption: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
