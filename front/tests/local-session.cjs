const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');

function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => imports[name] });
  return exports;
}

function localDb() {
  const db = new DatabaseSync(':memory:');
  return {
    close: () => db.close(),
    execAsync: async sql => db.exec(sql),
    runAsync: async (sql, params = []) => db.prepare(sql).run(...params),
    getAllAsync: async (sql, params = []) => db.prepare(sql).all(...params),
    getFirstAsync: async (sql, params = []) => db.prepare(sql).get(...params),
  };
}

(async () => {
  let usuarioId = 1;
  let versao = 1;
  let onCreate = () => undefined;
  let onUpdate = () => undefined;
  const requests = [];
  class ApiError extends Error { constructor(status) { super('Erro simulado'); this.status = status; } }
  const api = { ApiError, apiService: {
    requireUserId: () => { if (!usuarioId) throw new Error('Sem sessão'); return usuarioId; },
    getSessionVersion: () => versao,
    isSessionCurrent: v => v === versao && usuarioId !== null,
    criarMedicamento: async data => { requests.push(['POST', usuarioId, data.nome]); onCreate(); return { id: 101 }; },
    atualizarMedicamento: async () => { requests.push(['PUT', usuarioId]); onUpdate(); },
    listarMedicamentos: async () => [{ id: usuarioId * 10, nome: `Medicamento da conta ${usuarioId}` }],
  } };
  const session = load('src/services/sessaoLocal.ts', { './api': api });
  const agenda = load('src/services/agenda.ts', {});
  const service = load('src/services/lembretes.ts', { './api': api, './agenda': agenda, './sessaoLocal': session });
  const bancoA = localDb();
  const bancoB = localDb();
  const legado = localDb();
  const item = { id: 'local-a', nome: 'Somente A', intervalo: 8, frequencia: 3, serverId: null };
  try {
    for (const db of [bancoA, bancoB, legado]) await service.inicializarBanco(db);
    await legado.runAsync("INSERT INTO lembretes(id,nome,pendente) VALUES ('antigo','Sem dono conhecido',1)");
    await bancoA.runAsync('INSERT INTO lembretes(id,nome,pendente) VALUES (?,?,1)', [item.id, item.nome]);
    const sessaoA = session.capturarSessaoLocal();
    await service.sincronizarLembretes(bancoA, sessaoA);
    usuarioId = 2; versao++;
    await service.sincronizarLembretes(bancoB);
    assert.deepEqual((await bancoB.getAllAsync('SELECT nome FROM lembretes')).map(x => x.nome), ['Medicamento da conta 2']);
    assert.equal((await bancoA.getFirstAsync('SELECT nome FROM lembretes WHERE id = ?', [item.id])).nome, 'Somente A');
    assert.equal((await legado.getFirstAsync('SELECT pendente FROM lembretes')).pendente, 1);
    assert.deepEqual(requests, [['POST', 1, 'Somente A']]);

    // Uma ação iniciada na tela A não pode usar os cookies atuais de B.
    await assert.rejects(service.enviarLembrete(bancoA, item, sessaoA), /sessão mudou/);
    assert.equal(requests.length, 1);

    // A troca enquanto se consulta SQLite impede até a primeira chamada HTTP.
    usuarioId = 1; versao++;
    const pendente = service.sincronizarLembretes({ getAllAsync: async () => { usuarioId = 2; versao++; return [item]; } });
    await assert.rejects(pendente, /sessão mudou/);
    assert.equal(requests.length, 1);

    // O fallback PUT 404 -> POST não pode transferir dados da sessão antiga.
    usuarioId = 1; versao++;
    onUpdate = () => { usuarioId = 2; versao++; throw new ApiError(404); };
    await assert.rejects(service.enviarLembrete(bancoA, { ...item, serverId: 100 }), /sessão mudou/);
    assert.deepEqual(requests.at(-1), ['PUT', 1]);
    assert.equal(requests.length, 2);

    usuarioId = 1; versao++;
    onCreate = () => { usuarioId = 2; versao++; };
    await bancoA.runAsync('UPDATE lembretes SET pendente=1,serverId=NULL WHERE id=?', [item.id]);
    await assert.rejects(service.enviarLembrete(bancoA, item), /sessão mudou/);
    assert.equal((await bancoA.getFirstAsync('SELECT pendente FROM lembretes WHERE id=?', [item.id])).pendente, 1);

    // Logout concorre com uma programação já iniciada: a limpeza vence a fila.
    usuarioId = 1; versao++;
    const alarmesAgendados = [{ identifier: 'legado', content: { data: { id: 'antigo' } } }];
    const apresentados = [{ request: { identifier: 'entregue', content: { data: { syncmed: true, usuarioId: 1 } } } }];
    let interromperAgendamento = false;
    const notifications = {
      getPermissionsAsync: async () => ({ status: 'granted' }),
      getAllScheduledNotificationsAsync: async () => [...alarmesAgendados],
      getPresentedNotificationsAsync: async () => [...apresentados],
      cancelScheduledNotificationAsync: async id => { const index = alarmesAgendados.findIndex(n => n.identifier === id); if (index >= 0) alarmesAgendados.splice(index, 1); },
      dismissNotificationAsync: async id => { const index = apresentados.findIndex(n => n.request.identifier === id); if (index >= 0) apresentados.splice(index, 1); },
      scheduleNotificationAsync: async n => { alarmesAgendados.push(n); if (interromperAgendamento) { usuarioId = null; versao++; } },
      SchedulableTriggerInputTypes: { DATE: 'date' },
    };
    const alarmes = load('src/services/alarmes.ts', {
      'expo-notifications': notifications, 'react-native': { Platform: { OS: 'ios' } },
      './agenda': { dataLocal: () => '2026-01-01', horariosDoDia: () => [new Date(Date.now() + 60000)] },
      './sessaoLocal': session,
    });
    await alarmes.atualizarAlarmes([item]);
    assert(alarmesAgendados.length > 0);
    assert(alarmesAgendados.every(n => n.content.data.usuarioId === 1));
    assert(alarmesAgendados.every(n => n.identifier.startsWith('dose:1:')));
    await alarmes.cancelarTodosAlarmes();
    assert.equal(alarmesAgendados.length, 0);
    assert.equal(apresentados.length, 0);
    interromperAgendamento = true;
    const atualizacao = alarmes.atualizarAlarmes([item]);
    const limpeza = alarmes.cancelarTodosAlarmes();
    await assert.rejects(atualizacao, /sessão mudou/);
    await limpeza;
    assert.equal(alarmesAgendados.length, 0);
    assert.throws(() => session.capturarSessaoLocal(), /Sem sessão/);
    console.log('OK: SQLite A/B isolado, legado preservado, tarefas antigas bloqueadas e alarmes limpos no logout.');
  } finally {
    bancoA.close(); bancoB.close(); legado.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
