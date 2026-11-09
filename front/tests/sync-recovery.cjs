const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(file, imports, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => imports[name], setTimeout, clearTimeout, AbortController, ...globals });
  return exports;
}
(async () => {
  let status = 404;
  const config = { ENDPOINTS: { MEDICAMENTOS: 'http://test/medicamentos', LOGIN: 'http://test/login', SESSAO: 'http://test/me' } };
  const api = load('src/services/api.ts', {
    './config': { __esModule: true, default: config },
    './session-storage': { sessionStorage: { logoutPendente: async () => false } },
  }, {
    fetch: async url => url.includes('/medicamentos')
      ? new Response('Medicamento não encontrado!', { status })
      : Response.json({ id: 1, nome: 'Conta A', email: 'a@example.com' }),
  });
  await api.apiService.fazerLogin({ email: 'a@example.com', senha: 'senha-do-teste' });
  assert.equal(await api.apiService.deletarMedicamento(2), '');
  status = 500;
  await assert.rejects(api.apiService.deletarMedicamento(2), e => e instanceof api.ApiError && e.status === 500);
  let putStatus = 404;
  const calls = [];
  const mockApi = { ...api, apiService: {
    requireUserId: () => 1,
    getSessionVersion: () => 1,
    isSessionCurrent: version => version === 1,
    atualizarMedicamento: async (id) => { calls.push(['PUT', id]); if (putStatus) throw new api.ApiError(putStatus, 'error'); },
    criarMedicamento: async () => { calls.push(['POST']); return { id: 9 }; },
  } };
  const session = load('src/services/sessaoLocal.ts', { './api': mockApi });
  const service = load('src/services/lembretes.ts', { './api': mockApi, './agenda': {}, './sessaoLocal': session });
  const writes = [];
  const db = { runAsync: async (...args) => writes.push(args) };
  const item = { id: 'local', serverId: 2, nome: 'Teste', intervalo: 8, frequencia: 3 };
  await service.enviarLembrete(db, item);
  assert.equal(calls.map(c => c[0]).join(','), 'PUT,POST');
  assert.equal(writes[0][1][0], 9);
  assert.equal(writes[0][1][1], 'local');
  calls.length = 0; writes.length = 0; putStatus = 500;
  await assert.rejects(service.enviarLembrete(db, item));
  assert.equal(calls.length, 1); assert.equal(writes.length, 0);
  calls.length = 0; putStatus = 0;
  await service.enviarLembrete(db, item);
  assert.equal(calls.map(c => c[0]).join(','), 'PUT');
  assert.equal(writes[0][1][0], 2);
  console.log('OK: exclusão 404, recuperação de ID ausente, PUT normal e preservação de falhas 500.');
})().catch(error => { console.error(error); process.exitCode = 1; });
