import type { SQLiteDatabase } from 'expo-sqlite';
import { apiService } from './api';
import { type Remedio } from './agenda';
import { chaveDose, limparOcorrencia, naFilaAlarmes, prepararAvisos, programarDose, type Ocorrencia } from './alarmes';
import { validarSessaoLocal, type SessaoLocal } from './sessaoLocal';

const dataHora = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
};
let sincronizacao: Promise<void> = Promise.resolve();
export function sincronizarConfirmacoes(db: SQLiteDatabase, sessao: SessaoLocal): Promise<void> {
  const resultado = sincronizacao.catch(() => undefined).then(async () => {
    validarSessaoLocal(sessao);
    const pendentes = await db.getAllAsync<Ocorrencia & { serverId: number }>(`SELECT o.*, l.serverId FROM ocorrencias o
      JOIN lembretes l ON l.id = o.lembreteId WHERE o.estado = 'TOMADO' AND o.sincronizada = 0 AND l.serverId IS NOT NULL`);
    for (const o of pendentes) {
      validarSessaoLocal(sessao);
      await apiService.confirmarLembrete({ medicamentoId: o.serverId, ocorrencia: o.chave,
        prevista: dataHora(new Date(o.prevista)), realizada: o.realizada! });
      validarSessaoLocal(sessao);
      await db.runAsync('UPDATE ocorrencias SET sincronizada = 1 WHERE chave = ?', [o.chave]);
    }
  });
  sincronizacao = resultado;
  return resultado;
}
export function agirOcorrencia(db: SQLiteDatabase, item: Remedio, prevista: number,
  estado: Ocorrencia['estado'], sessao: SessaoLocal): Promise<void> {
  return naFilaAlarmes(async () => {
    validarSessaoLocal(sessao);
    const chave = chaveDose(item.id, prevista);
    const atual = await db.getFirstAsync<Ocorrencia>('SELECT * FROM ocorrencias WHERE chave = ?', [chave]);
    if (atual && atual.estado !== 'ADIADO') { await limparOcorrencia(chave, sessao); return; }
    if (estado === 'ADIADO' && !await prepararAvisos(false)) throw new Error('Notificações não autorizadas');
    validarSessaoLocal(sessao);
    const adiadaAte = estado === 'ADIADO' ? Date.now() + 5 * 60000 : null;
    // Persist before touching the OS queue: a restart can restore the desired snooze.
    await db.runAsync(`INSERT INTO ocorrencias (chave, lembreteId, prevista, estado, adiadaAte, realizada)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(chave) DO UPDATE SET estado=excluded.estado,
      adiadaAte=excluded.adiadaAte, realizada=excluded.realizada`,
      [chave, item.id, prevista, estado, adiadaAte, estado === 'TOMADO' ? dataHora(new Date()) : null]);
    await limparOcorrencia(chave, sessao);
    if (adiadaAte) await programarDose(item, prevista, adiadaAte, sessao);
  });
}
