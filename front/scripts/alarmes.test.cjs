const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function ambiente() {
  const sqlite = new DatabaseSync(':memory:');
  const db = {
    execAsync: async sql => sqlite.exec(sql),
    runAsync: async (sql, params = []) => sqlite.prepare(sql).run(...params),
    getAllAsync: async (sql, params = []) => sqlite.prepare(sql).all(...params),
    getFirstAsync: async (sql, params = []) => sqlite.prepare(sql).get(...params),
  };
  const scheduled = new Map(); let permitted = true, user = 1, chamadas = 0, offline = false;
  const session = { usuarioId: 1, versao: 1 };
  const notifications = {
    AndroidImportance: { DEFAULT: 3, HIGH: 4 }, IosAuthorizationStatus: { PROVISIONAL: 3 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => ({ granted: permitted }),
    requestPermissionsAsync: async () => ({ granted: permitted }),
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    getPresentedNotificationsAsync: async () => [], dismissNotificationAsync: async () => {},
    scheduleNotificationAsync: async n => { scheduled.set(n.identifier, n); },
    cancelScheduledNotificationAsync: async id => { scheduled.delete(id); },
  };
  const mocks = {
    'expo-notifications': notifications, 'expo-constants': { default: { appOwnership: 'expo' } },
    'react-native': { Platform: { OS: 'android' } },
    './sessaoLocal': { capturarSessaoLocal: () => session, validarSessaoLocal: s => { if (s.usuarioId !== user) throw Error('sessao'); } },
    './api': { ApiError: class extends Error {}, apiService: { confirmarLembrete: async () => { if (offline) throw Error('offline'); chamadas++; } } },
  };
  const cache = {};
  function load(name) {
    if (mocks[name]) return mocks[name];
    if (cache[name]) return cache[name];
    const file = path.join(__dirname, '../src/services', name.replace('./', '') + '.ts');
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { Date, Map, Set, Promise })(load, module, module.exports);
    return cache[name] = module.exports;
  }
  const item = { id: 'local1', nome: 'Teste', username: '', dose: '23:59', intervalo: 8, frequencia: 7, inicio: load('./agenda').dataLocal(), serverId: 10, pendente: 0, nivelAviso: 'ALARME', dosagem: '1 comprimido' };
  return { db, item, session, scheduled, load, deny: () => permitted = false, trocar: () => user = 2, offline: v => offline = v, chamadas: () => chamadas };
}
async function preparar(a) {
  await a.load('./lembretes').inicializarBanco(a.db);
  await a.db.runAsync('INSERT INTO lembretes (id,nome,serverId) VALUES (?,?,?)', [a.item.id,a.item.nome,10]);
}
test('migração conserva registros antigos e define Notificação', async () => {
  const a=ambiente();
  await a.db.execAsync("CREATE TABLE lembretes (id TEXT PRIMARY KEY, username TEXT, nome TEXT, intervalo INT, frequencia INT, dose TEXT); INSERT INTO lembretes VALUES ('antigo','','Nome',8,7,'08:00');");
  await a.load('./lembretes').inicializarBanco(a.db);
  await a.load('./lembretes').inicializarBanco(a.db);
  const old=await a.db.getFirstAsync('SELECT * FROM lembretes');
  assert.equal(old.nome,'Nome');assert.equal(old.nivelAviso,'NOTIFICACAO');
});
test('níveis, dosagem, recorrência, edição sem duplicação e exclusão', async () => {
  const a=ambiente();await preparar(a);const service=a.load('./alarmes');
  await service.atualizarAlarmes([a.item],false,a.session,a.db);
  const before=a.scheduled.size;assert.ok(before>1);
  assert.equal([...a.scheduled.values()][0].content.data.nivelAviso,'ALARME');
  assert.match([...a.scheduled.values()][0].content.body,/1 comprimido/);
  await service.atualizarAlarmes([a.item],false,a.session,a.db);assert.equal(a.scheduled.size,before);
  a.item.nivelAviso='NOTIFICACAO';a.item.dose='23:58';
  await service.atualizarAlarmes([a.item],false,a.session,a.db);
  assert.ok([...a.scheduled.values()].every(n=>n.content.data.nivelAviso==='NOTIFICACAO' && n.trigger.channelId==='syncmed-notificacao-v1'));
  await service.cancelarAlarmes(a.item.id,a.session);assert.equal(a.scheduled.size,0);
});
test('adiamento sobrevive à reconciliação e mantém próximos horários; confirmar é idempotente offline', async () => {
  const a=ambiente();await preparar(a);const alarms=a.load('./alarmes'),actions=a.load('./ocorrencias');
  await alarms.atualizarAlarmes([a.item],false,a.session,a.db);
  const first=[...a.scheduled.values()][0].content.data.prevista,before=a.scheduled.size;
  await actions.agirOcorrencia(a.db,a.item,first,'ADIADO',a.session);
  let snoozed=[...a.scheduled.values()].find(n=>n.content.data.prevista===first);
  assert.ok(Math.abs(snoozed.content.data.disparo-Date.now()-300000)<2000);
  await alarms.atualizarAlarmes([a.item],false,a.session,a.db);assert.equal(a.scheduled.size,before);
  a.offline(true);
  await Promise.all([actions.agirOcorrencia(a.db,a.item,first,'TOMADO',a.session),actions.agirOcorrencia(a.db,a.item,first,'TOMADO',a.session)]);
  assert.equal((await a.db.getAllAsync('SELECT * FROM ocorrencias')).length,1);
  await assert.rejects(actions.sincronizarConfirmacoes(a.db,a.session));
  assert.equal(a.scheduled.size,before-1);
  a.offline(false);await actions.sincronizarConfirmacoes(a.db,a.session);await actions.sincronizarConfirmacoes(a.db,a.session);assert.equal(a.chamadas(),1);
});
test('dispensar não confirma; permissão negada cancela avisos; sessão antiga não agenda', async () => {
  const a=ambiente();await preparar(a);const alarms=a.load('./alarmes'),actions=a.load('./ocorrencias');
  await alarms.atualizarAlarmes([a.item],false,a.session,a.db);
  const first=[...a.scheduled.values()][0].content.data.prevista;
  await actions.agirOcorrencia(a.db,a.item,first,'DISPENSADO',a.session);
  await actions.sincronizarConfirmacoes(a.db,a.session);assert.equal(a.chamadas(),0);
  a.deny();await assert.rejects(alarms.atualizarAlarmes([a.item],true,a.session,a.db));assert.equal(a.scheduled.size,0);
  a.trocar();await assert.rejects(alarms.atualizarAlarmes([a.item],false,a.session,a.db));
});
test('fila limitada a 60 e logout preserva dados locais para restauração', async () => {
  const a=ambiente();await preparar(a);a.item.intervalo=1;a.item.frequencia=365;
  const alarms=a.load('./alarmes');
  await alarms.atualizarAlarmes([a.item],false,a.session,a.db);assert.equal(a.scheduled.size,60);
  assert.equal([...a.scheduled.values()][0].trigger.delivery,'alarmClock');
  await alarms.cancelarTodosAlarmes();assert.equal(a.scheduled.size,0);
  assert.equal((await a.db.getAllAsync('SELECT * FROM lembretes')).length,1);
  await alarms.atualizarAlarmes([a.item],false,a.session,a.db);assert.equal(a.scheduled.size,60);
});
