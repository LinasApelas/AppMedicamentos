import type { SQLiteDatabase } from 'expo-sqlite';
import { ApiError, apiService } from './api';
import { dataLocal, type Remedio } from './agenda';
import { capturarSessaoLocal, validarSessaoLocal, type SessaoLocal } from './sessaoLocal';

export async function inicializarBanco(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS lembretes (id TEXT PRIMARY KEY NOT NULL, username TEXT, nome TEXT NOT NULL, intervalo INT, frequencia INT, dose TEXT);`);
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lembretes)');
  for (const [name, type] of [['inicio', 'TEXT'], ['serverId', 'INTEGER'], ['pendente', 'INTEGER NOT NULL DEFAULT 0']]) {
    if (!columns.some(column => column.name === name)) await db.execAsync(`ALTER TABLE lembretes ADD COLUMN ${name} ${type}`);
  }
  await db.runAsync("UPDATE lembretes SET serverId = CAST(substr(id, 8) AS INTEGER) WHERE id LIKE 'server-%' AND serverId IS NULL");
  // IDs antigos locais são timestamps; conservar o dia real de cadastro.
  const antigos = await db.getAllAsync<Remedio>('SELECT * FROM lembretes WHERE inicio IS NULL');
  for (const item of antigos) {
    if (/^\d{13}$/.test(item.id)) await db.runAsync('UPDATE lembretes SET inicio = ? WHERE id = ?', [dataLocal(new Date(Number(item.id))), item.id]);
  }
}

export async function enviarLembrete(db: SQLiteDatabase, item: Remedio, sessao: SessaoLocal = capturarSessaoLocal()) {
  validarSessaoLocal(sessao);
  const payload = { nome: item.nome, unidadeMedida: 'porção', descricao: `Intervalo: ${item.intervalo}h, Frequência: ${item.frequencia} dias` };
  let serverId = item.serverId;
  if (serverId) {
    try { await apiService.atualizarMedicamento(serverId, payload); }
    catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
      // O cadastro local foi editado, mas seu antigo ID não existe mais.
      validarSessaoLocal(sessao);
      serverId = (await apiService.criarMedicamento(payload)).id;
    }
  } else serverId = (await apiService.criarMedicamento(payload)).id;
  validarSessaoLocal(sessao);
  await db.runAsync('UPDATE lembretes SET serverId = ?, pendente = 0 WHERE id = ?', [serverId!, item.id]);
}

export async function sincronizarLembretes(db: SQLiteDatabase, sessao: SessaoLocal = capturarSessaoLocal()) {
  validarSessaoLocal(sessao);
  const pending = await db.getAllAsync<Remedio>('SELECT * FROM lembretes WHERE pendente = 1');
  validarSessaoLocal(sessao);
  for (const item of pending) await enviarLembrete(db, item, sessao);
  validarSessaoLocal(sessao);
  const server = await apiService.listarMedicamentos();
  for (const item of server) {
    validarSessaoLocal(sessao);
    const existing = await db.getFirstAsync<Remedio>('SELECT * FROM lembretes WHERE serverId = ?', [item.id]);
    validarSessaoLocal(sessao);
    if (existing) continue; // Não substituir horários locais por descrições do catálogo.
    await db.runAsync('INSERT OR IGNORE INTO lembretes (id, nome, username, serverId) VALUES (?, ?, ?, ?)', [`server-${item.id}`, item.nome, '', item.id]);
  }
}
