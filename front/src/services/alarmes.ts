import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { dataLocal, horariosDoDia, type Remedio } from './agenda';
import { capturarSessaoLocal, validarSessaoLocal, type SessaoLocal } from './sessaoLocal';

// Serializar programação e limpeza impede que uma operação antiga recrie alarmes após sair.
let fila: Promise<void> = Promise.resolve();
function naFila(operacao: () => Promise<void>): Promise<void> {
  const resultado = fila.catch(() => undefined).then(operacao);
  fila = resultado;
  return resultado;
}

function alarmeDoApp(data: Record<string, unknown> | undefined): boolean {
  return data?.syncmed === true || typeof data?.id === 'string';
}

export function cancelarTodosAlarmes(): Promise<void> {
  return naFila(async () => {
    if (Platform.OS === 'web') return;
    for (const notification of await Notifications.getAllScheduledNotificationsAsync()) {
      if (alarmeDoApp(notification.content.data)) await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
    for (const notification of await Notifications.getPresentedNotificationsAsync()) {
      if (alarmeDoApp(notification.request.content.data)) await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  });
}

export function cancelarAlarmes(id: string, sessao: SessaoLocal = capturarSessaoLocal()): Promise<void> {
  return naFila(async () => {
    validarSessaoLocal(sessao);
    if (Platform.OS === 'web') return;
    for (const notification of await Notifications.getAllScheduledNotificationsAsync()) {
      validarSessaoLocal(sessao);
      if (notification.content.data?.id === id && notification.content.data?.usuarioId === sessao.usuarioId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  });
}

// Mantém uma fila global de até 60 notificações; repõe ao abrir a agenda.
export function atualizarAlarmes(items: Remedio[], pedirPermissao = false, sessao: SessaoLocal = capturarSessaoLocal()): Promise<void> {
  return naFila(async () => {
  validarSessaoLocal(sessao);
  if (Platform.OS === 'web') return;
  const permission = pedirPermissao ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync();
  validarSessaoLocal(sessao);
  if (permission.status !== 'granted') return;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('remedios-urgentes', {
    name: 'Alarmes de medicamentos', importance: AndroidImportance.MAX, sound: 'default',
  });
  validarSessaoLocal(sessao);
  const now = Date.now();
  const doses: { item: Remedio; date: Date }[] = [];
  for (const item of items) {
    let count = 0;
    for (let day = 0; day < 366 && count < 60; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      for (const dose of horariosDoDia(item, dataLocal(date))) {
        if (dose.getTime() > now) { doses.push({ item, date: dose }); count++; }
      }
    }
  }
  const wanted = doses.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 60);
  const ids = new Set(wanted.map(({ item, date }) => `dose:${sessao.usuarioId}:${item.id}:${date.getTime()}:${item.nome}`));
  const current = await Notifications.getAllScheduledNotificationsAsync();
  validarSessaoLocal(sessao);
  for (const notification of current) {
    validarSessaoLocal(sessao);
    if (alarmeDoApp(notification.content.data) && !ids.has(notification.identifier)) await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
  const existing = new Set(current.map(notification => notification.identifier));
  for (const { item, date } of wanted) {
    validarSessaoLocal(sessao);
    const identifier = `dose:${sessao.usuarioId}:${item.id}:${date.getTime()}:${item.nome}`;
    if (existing.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({ identifier,
      content: { title: 'Hora do medicamento', body: item.nome, sound: 'default', data: { syncmed: true, id: item.id, usuarioId: sessao.usuarioId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'remedios-urgentes' },
    });
  }
  });
}
