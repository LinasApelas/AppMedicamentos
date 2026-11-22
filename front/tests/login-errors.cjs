const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function cliente(fetch) {
  const exports = {};
  const imports = { './config': { API_CONFIG: { ENDPOINTS: { LOGIN: '/login', SESSAO: '/me' } } },
    './session-storage': { sessionStorage: { logoutPendente: async () => false } } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services/api.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: n => imports[n], fetch, AbortController, setTimeout, clearTimeout, Error });
  return exports;
}
test('login: rede, timeout, credenciais e servidor têm mensagens distintas; sem sessão falsa', async () => {
  for (const kind of ['network', 'timeout', '401', '503']) {
    const api = cliente(async () => {
      if (kind === 'network') throw new Error('fetch failed');
      if (kind === 'timeout') throw new Error('The request timed out');
      return new Response('', { status: Number(kind) });
    });
    let error;
    try { await api.apiService.fazerLogin({ email: 'fixture@example.com', senha: 'fixture' }); } catch (e) { error = e; }
    assert.ok(error);
    assert.match(api.mensagemErroLogin(error), {
      network: /Não foi possível conectar/, timeout: /demorou/, '401': /senha incorretos/, '503': /indisponível/,
    }[kind]);
    assert.equal(api.apiService.currentUser, null);
  }
});
test('login aceito mas cookie recusado não é apresentado como senha incorreta', async () => {
  const api = cliente(async (url, options) => {
    assert.equal(options.credentials, 'include');
    return url === '/login' ? Response.json({ id: 1, nome: 'Fixture' }) : new Response('', { status: 401 });
  });
  await assert.rejects(api.apiService.fazerLogin({ email: 'fixture@example.com', senha: 'fixture' }), error => {
    assert.equal(error.status, 409); assert.match(api.mensagemErroLogin(error), /sessão não foi mantida/); return true;
  });
  assert.equal(api.apiService.currentUser, null);
});
