const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');

test('visitante persiste sem API, agenda, confirma, edita e não transfere dados para conta', async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'syncmed-guest-'));
  let sqlite;
  let user = null, version = 0, calls = 0;
  const scheduled = new Map();
  const imports = {};
  function load(name) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services', name + '.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: false },
    }).outputText;
    vm.runInNewContext(code, { exports, require: name => imports[name] });
    imports['./' + name] = exports;
    return exports;
  }
  const api = { get currentUser() { return user; }, getSessionVersion: () => version };
  for (const name of ['criarMedicamento', 'atualizarMedicamento', 'listarMedicamentos', 'confirmarLembrete']) {
    api[name] = async () => { calls++; throw new Error('Servidor desligado'); };
  }
  imports['./api'] = { apiService: api, ApiError: Error };
  imports['react-native'] = { Platform: { OS: 'ios' } };
  imports['expo-constants'] = { default: { appOwnership: 'expo' } };
  imports['expo-notifications'] = {
    AndroidImportance: {}, IosAuthorizationStatus: {}, SchedulableTriggerInputTypes: { DATE: 'date' },
    setNotificationCategoryAsync: async () => {}, getPermissionsAsync: async () => ({ granted: true }),
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    getPresentedNotificationsAsync: async () => [],
    scheduleNotificationAsync: async n => scheduled.set(n.identifier, n),
    cancelScheduledNotificationAsync: async id => scheduled.delete(id),
  };
  const session = load('sessaoLocal');
  load('agenda');
  const reminders = load('lembretes');
  const alarms = load('alarmes');
  const occurrences = load('ocorrencias');
  const db = {
    execAsync: async sql => sqlite.exec(sql),
    runAsync: async (sql, args = []) => sqlite.prepare(sql).run(...args),
    getAllAsync: async (sql, args = []) => sqlite.prepare(sql).all(...args),
    getFirstAsync: async (sql, args = []) => sqlite.prepare(sql).get(...args),
  };
  try {
    const file = path.join(folder, 'medicamentos_visitante.db');
    sqlite = new DatabaseSync(file);
    await reminders.inicializarBanco(db);
    await db.runAsync("INSERT INTO lembretes(id,nome,nivelAviso,pendente) VALUES ('local','Teste','ALARME',1)");
    const guest = session.capturarSessaoLocal();
    assert.equal(guest.usuarioId, 0);
    const item = await db.getFirstAsync('SELECT * FROM lembretes');
    await reminders.enviarLembrete(db, item, guest);
    await reminders.sincronizarLembretes(db, guest);
    const due = Date.now() + 60000;
    await alarms.programarDose(item, due, due, guest);
    assert.equal([...scheduled.values()][0].content.data.usuarioId, 0);
    await occurrences.agirOcorrencia(db, item, due, 'TOMADO', guest);
    await occurrences.sincronizarConfirmacoes(db, guest);
    assert.equal(calls, 0);
    sqlite.close();
    sqlite = new DatabaseSync(file);
    assert.equal((await db.getFirstAsync('SELECT estado FROM ocorrencias')).estado, 'TOMADO');
    await db.runAsync("UPDATE lembretes SET nome='Editado' WHERE id='local'");
    assert.equal((await db.getFirstAsync('SELECT nome FROM lembretes')).nome, 'Editado');
    user = { id: 9 }; version++;
    assert.equal(session.sessaoLocalAtual(guest), false);
    await assert.rejects(reminders.sincronizarLembretes(db, guest), /sessão mudou/);
    assert.equal(calls, 0, 'login não pode enviar a agenda do visitante');
    user = null; version++;
    const returned = session.capturarSessaoLocal();
    await reminders.sincronizarLembretes(db, returned);
    assert.equal((await db.getFirstAsync('SELECT nome FROM lembretes')).nome, 'Editado');
    await db.runAsync("DELETE FROM ocorrencias WHERE lembreteId='local'");
    await db.runAsync("DELETE FROM lembretes WHERE id='local'");
    assert.equal((await db.getAllAsync('SELECT * FROM lembretes')).length, 0);
    assert.equal(calls, 0);
  } finally {
    sqlite?.close();
    if (path.dirname(folder) !== path.resolve(os.tmpdir())) throw new Error('Diretório temporário inválido');
    fs.rmSync(folder, { recursive: true });
  }
});
