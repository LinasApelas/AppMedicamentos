import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dataLocal, horariosDoDia, type Remedio } from './agenda';

export async function cancelarAlarmes(id: string) {
  for (const notification of await Notifications.getAllScheduledNotificationsAsync()) {
    if (notification.content.data?.id === id) await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

// Mantém uma fila global de até 60 notificações; repõe ao abrir a agenda.
export async function atualizarAlarmes(items: Remedio[], pedirPermissao = false) {
  if (Platform.OS === 'web') return;
  const permission = pedirPermissao ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('remedios-urgentes', {
    name: 'Alarmes de medicamentos', importance: Notifications.AndroidImportance.MAX, sound: 'default',
  });
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
  const ids = new Set(wanted.map(({ item, date }) => `dose:${item.id}:${date.getTime()}:${item.nome}`));
  const current = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of current) {
    if (notification.content.data?.id && !ids.has(notification.identifier)) await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
  const existing = new Set(current.map(notification => notification.identifier));
  for (const { item, date } of wanted) {
    const identifier = `dose:${item.id}:${date.getTime()}:${item.nome}`;
    if (existing.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({ identifier,
      content: { title: 'Hora do medicamento', body: item.nome, sound: 'default', data: { id: item.id } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'remedios-urgentes' },
    });
  }
}
