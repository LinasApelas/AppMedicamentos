import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { dataLocal, horariosDoDia, type Remedio } from './agenda';
import { capturarSessaoLocal, validarSessaoLocal, type SessaoLocal } from './sessaoLocal';

export interface Ocorrencia {
  chave: string; lembreteId: string; prevista: number;
  estado: 'TOMADO' | 'DISPENSADO' | 'ADIADO'; adiadaAte: number | null;
  realizada: string | null; sincronizada: number;
}
export const chaveDose = (id: string, prevista: number) => `${id}:${prevista}`;
export const revisao = (item: Remedio) => JSON.stringify([Platform.OS === 'android' ? 'avisos-android-v3' : 'avisos-v2', item.nome, item.dosagem || '', item.nivelAviso || 'NOTIFICACAO', item.inicio, item.dose, item.intervalo, item.frequencia]);
const somAlarme = Constants.appOwnership === 'expo' ? 'default' : 'syncmed-alarme.wav';
let fila: Promise<void> = Promise.resolve();
export function naFilaAlarmes(operacao: () => Promise<void>): Promise<void> {
  const resultado = fila.catch(() => undefined).then(operacao);
  fila = resultado;
  return resultado;
}
function alarmeDoApp(data: Record<string, unknown> | undefined): boolean {
  return data?.syncmed === true || typeof data?.id === 'string';
}
export function cancelarTodosAlarmes(): Promise<void> {
  return naFilaAlarmes(async () => {
    if (Platform.OS === 'web') return;
    for (const n of await Notifications.getAllScheduledNotificationsAsync()) {
      if (alarmeDoApp(n.content.data)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    for (const n of await Notifications.getPresentedNotificationsAsync()) {
      if (alarmeDoApp(n.request.content.data)) await Notifications.dismissNotificationAsync(n.request.identifier);
    }
  });
}
export function cancelarAlarmes(id: string, sessao: SessaoLocal = capturarSessaoLocal()): Promise<void> {
  return naFilaAlarmes(async () => {
    validarSessaoLocal(sessao);
    if (Platform.OS === 'web') return;
    for (const n of await Notifications.getAllScheduledNotificationsAsync()) {
      validarSessaoLocal(sessao);
      if (n.content.data?.id === id && n.content.data?.usuarioId === sessao.usuarioId)
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    for (const n of await Notifications.getPresentedNotificationsAsync()) {
      if (n.request.content.data?.id === id && n.request.content.data?.usuarioId === sessao.usuarioId)
        await Notifications.dismissNotificationAsync(n.request.identifier);
    }
  });
}
export async function prepararAvisos(pedir: boolean) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('syncmed-notificacao-v1', {
      name: 'Notificações de medicamentos', importance: AndroidImportance.DEFAULT, sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('syncmed-alarme-v1', {
      name: 'Alarmes de medicamentos', importance: AndroidImportance.HIGH, sound: somAlarme,
      enableVibrate: true, vibrationPattern: [0, 400, 200, 400], bypassDnd: false,
    });
  }
  await Notifications.setNotificationCategoryAsync('syncmed-alarme', [{
    identifier: 'VER_ALARME', buttonTitle: 'Ver medicamento', options: { opensAppToForeground: true },
  }]);
  const permission = pedir ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync();
  return permission.granted || permission.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}
export async function programarDose(item: Remedio, prevista: number, disparo: number, sessao: SessaoLocal) {
  validarSessaoLocal(sessao);
  const alarme = item.nivelAviso === 'ALARME';
  const chave = chaveDose(item.id, prevista);
  await Notifications.scheduleNotificationAsync({
    identifier: `syncmed:${sessao.usuarioId}:${chave}:${disparo}:${revisao(item)}`,
    content: {
      title: Platform.OS === 'android' ? `${alarme ? '⏰' : '💊'} ${item.nome}` : alarme ? '⏰ Hora do medicamento!' : '💊 Hora do medicamento!',
      body: Platform.OS === 'android'
        ? `${item.dosagem ? item.dosagem + ' · ' : ''}Hora de tomar ${item.nome}.`
        : `Está na hora de tomar seu medicamento: ${item.nome}${item.dosagem ? ' — ' + item.dosagem : ''}.`,
      sound: alarme ? somAlarme : 'default',
      categoryIdentifier: alarme ? 'syncmed-alarme' : undefined,
      data: { syncmed: true, id: item.id, usuarioId: sessao.usuarioId, nivelAviso: item.nivelAviso || 'NOTIFICACAO', prevista, disparo, chave, revisao: revisao(item) },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(disparo), delivery: alarme ? 'alarmClock' : 'bestEffort',
      channelId: alarme ? 'syncmed-alarme-v1' : 'syncmed-notificacao-v1' },
  });
}
// Used inside the serialized queue only. Never cancels other occurrences.
export async function limparOcorrencia(chave: string, sessao: SessaoLocal) {
  validarSessaoLocal(sessao);
  if (Platform.OS === 'web') return;
  for (const n of await Notifications.getAllScheduledNotificationsAsync()) {
    if (n.content.data?.chave === chave && n.content.data?.usuarioId === sessao.usuarioId)
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  for (const n of await Notifications.getPresentedNotificationsAsync()) {
    if (n.request.content.data?.chave === chave && n.request.content.data?.usuarioId === sessao.usuarioId)
      await Notifications.dismissNotificationAsync(n.request.identifier);
  }
}
export function atualizarAlarmes(items: Remedio[], pedirPermissao = false, sessao: SessaoLocal = capturarSessaoLocal(), db?: SQLiteDatabase): Promise<void> {
  return naFilaAlarmes(async () => {
    validarSessaoLocal(sessao);
    if (Platform.OS === 'web') return;
    const permitido = await prepararAvisos(pedirPermissao);
    validarSessaoLocal(sessao);
    const ocorrencias = db ? await db.getAllAsync<Ocorrencia>('SELECT * FROM ocorrencias') : [];
    const estados = new Map(ocorrencias.map(o => [o.chave, o]));
    const now = Date.now();
    const doses: { item: Remedio; prevista: number; disparo: number }[] = [];
    for (const item of items) {
      let count = 0;
      for (let day = 0; day < 366 && count < 60; day++) {
        const date = new Date(now); date.setDate(date.getDate() + day);
        for (const dose of horariosDoDia(item, dataLocal(date))) {
          const prevista = dose.getTime();
          if (prevista > now && !estados.has(chaveDose(item.id, prevista))) {
            doses.push({ item, prevista, disparo: prevista }); count++;
          }
        }
      }
      for (const o of ocorrencias) {
        if (o.lembreteId === item.id && o.estado === 'ADIADO' && o.adiadaAte && o.adiadaAte > now)
          doses.push({ item, prevista: o.prevista, disparo: o.adiadaAte });
      }
    }
    const wanted = permitido ? doses.sort((a, b) => a.disparo - b.disparo).slice(0, 60) : [];
    const identifier = ({ item, prevista, disparo }: typeof doses[number]) => `syncmed:${sessao.usuarioId}:${chaveDose(item.id, prevista)}:${disparo}:${revisao(item)}`;
    const ids = new Set(wanted.map(identifier));
    const current = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of await Notifications.getPresentedNotificationsAsync()) {
      validarSessaoLocal(sessao);
      const data = n.request.content.data;
      if (!alarmeDoApp(data)) continue;
      const item = items.find(item => item.id === data?.id);
      if (!item || data?.usuarioId !== sessao.usuarioId || data?.revisao !== revisao(item))
        await Notifications.dismissNotificationAsync(n.request.identifier);
    }
    for (const n of current) {
      validarSessaoLocal(sessao);
      if (alarmeDoApp(n.content.data) && !ids.has(n.identifier)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    const existing = new Set(current.map(n => n.identifier));
    for (const dose of wanted) {
      validarSessaoLocal(sessao);
      if (!existing.has(identifier(dose))) await programarDose(dose.item, dose.prevista, dose.disparo, sessao);
    }
    if (!permitido) throw new Error('Notificações não autorizadas. Ative-as nos ajustes do aparelho.');
    if (Platform.OS === 'android' && wanted.some(dose => dose.item.nivelAviso === 'ALARME')) {
      let exato;
      try { exato = await Notifications.getExactAlarmPermissionsAsync(); }
      catch { throw new Error('Avisos agendados, mas não foi possível verificar alarmes exatos. Confira Alarmes e lembretes nos ajustes do Android e teste em um APK atualizado.'); }
      if (!exato.granted) throw new Error('Avisos agendados em horário aproximado. Para ALARME, permita Alarmes e lembretes nos ajustes do Android e reabra a agenda.');
    }
  });
}
