const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const config = { ENDPOINTS: {
  USUARIOS: '/usuarios', LOGIN: '/usuarios/login', SESSAO: '/usuarios/me',
  LOGOUT: '/usuarios/logout', MEDICAMENTOS: '/medicamentos',
} };
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services/api.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Simula somente o transporte/cookie do cliente. BCrypt e cookies reais são testados no backend.
const a = { id: 11, nome: 'Conta A', email: 'a@example.com' };
const b = { id: 22, nome: 'Conta B', email: 'b@example.com' };
let serverUser = null;
let pendingLogout = false;
let offline = false;
let delayedRequest;
const calls = [];
const sessionStorage = {
  logoutPendente: async () => pendingLogout,
  marcarLogout: async () => { pendingLogout = true; },
  concluirLogout: async () => { pendingLogout = false; },
};
function newClient() {
  const exports = {};
  vm.runInNewContext(source, {
    exports, setTimeout, clearTimeout, AbortController,
    require: name => ({ './config': { API_CONFIG: config }, './session-storage': { sessionStorage } })[name],
    fetch: async (url, options) => {
      calls.push([url, options.method]);
      assert.equal(options.credentials, 'include');
      assert.equal(options.headers['X-SyncMed-Client'], '1');
      if (offline) throw new Error('Rede indisponível');
      if (url === '/usuarios' && options.method === 'POST') return new Response('Criado', { status: 201 });
      if (url === '/usuarios/login') {
        const credentials = JSON.parse(options.body);
        if (credentials.email === a.email) serverUser = a;
        else if (credentials.email === b.email) serverUser = b;
        else return new Response(null, { status: 401 });
        return Response.json(serverUser);
      }
      if (url === '/usuarios/logout') { serverUser = null; return new Response(null, { status: 204 }); }
      if (!serverUser) return new Response(null, { status: 401 });
      if (url === '/usuarios/me') return Response.json(serverUser);
      if (options.headers['X-SyncMed-User'] !== String(serverUser.id)) return new Response(null, { status: 401 });
      if (url === '/medicamentos' && delayedRequest) return delayedRequest;
      if (url === '/medicamentos') return Response.json([{ id: serverUser.id, nome: serverUser.nome }]);
      throw new Error('Requisição inesperada');
    },
  });
  return exports.apiService;
}

(async () => {
  let client = newClient();
  assert.equal(await client.restaurarSessao(), null);
  assert.equal(client.currentUser, null);
  await assert.rejects(client.listarMedicamentos(), error => error.status === 401);
  assert(!calls.some(([url, method]) => url === '/usuarios' && method === 'GET'));

  await client.criarUsuario({ ...a, senha: 'fixture-apenas' });
  assert.equal(client.currentUser, null, 'Cadastro mantém fluxo de login explícito');
  await client.fazerLogin({ email: a.email, senha: 'fixture-apenas' });
  assert.equal(client.currentUser.id, a.id);
  const stableVersion = client.getSessionVersion();
  await client.restaurarSessao();
  assert.equal(client.getSessionVersion(), stableVersion, 'Atualizar perfil não invalida tarefas da mesma sessão');

  client = newClient(); // Reload: nenhuma memória de usuário é reutilizada.
  assert.equal(client.currentUser, null);
  await client.restaurarSessao();
  assert.equal(client.currentUser.id, a.id);
  assert.equal((await client.listarMedicamentos())[0].id, a.id);

  let finishOldRequest;
  delayedRequest = new Promise(resolve => { finishOldRequest = resolve; });
  const oldResult = client.listarMedicamentos();
  const oldRejected = assert.rejects(oldResult, error => error.status === 401);
  await client.logout();
  assert.equal(client.currentUser, null);
  assert.equal(serverUser, null);
  await client.fazerLogin({ email: b.email, senha: 'fixture-apenas' });
  finishOldRequest(Response.json([{ id: a.id }]));
  await oldRejected;
  delayedRequest = undefined;
  assert.equal(client.currentUser.id, b.id);
  assert.equal((await client.listarMedicamentos())[0].id, b.id);

  serverUser = a; // Outra aba mudou o cookie, mas esta ainda mantém a conta B na memória.
  await assert.rejects(client.listarMedicamentos(), error => error.status === 401);
  assert.equal(client.currentUser, null, 'Não usar o cookie de A para gravar no banco local de B');
  await client.fazerLogin({ email: b.email, senha: 'fixture-apenas' });

  offline = true;
  await assert.rejects(client.logout());
  assert.equal(client.currentUser, null);
  assert.equal(pendingLogout, true, 'Intenção de logout sobrevive à falha de rede');
  client = newClient();
  const from = calls.length;
  await assert.rejects(client.restaurarSessao());
  assert.equal(client.currentUser, null);
  assert(!calls.slice(from).some(([url]) => url === '/usuarios/me'), 'Não restaura sessão com logout pendente');
  offline = false;
  assert.equal(await client.restaurarSessao(), null);
  assert.equal(serverUser, null);
  assert.equal(pendingLogout, false);

  await client.fazerLogin({ email: a.email, senha: 'fixture-apenas' });
  serverUser = null; // Expiração ou reinício do backend.
  await assert.rejects(client.listarMedicamentos(), error => error.status === 401);
  assert.equal(client.currentUser, null);
  assert.equal(await newClient().restaurarSessao(), null);
  assert(!calls.some(([url, method]) => url === '/usuarios' && method === 'GET'));
  console.log('OK: cadastro/login A, reload, refresh, logout, login B, respostas antigas, logout offline, expiração e ausência de seleção automática.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
