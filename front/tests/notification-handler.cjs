const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

test('handler: Android mantém aviso nativo, iOS preserva áudio próprio, visitante isolado', async () => {
  for (const os of ['android', 'ios']) {
    let handler;
    const state = { currentState: 'active' };
    const imports = {
      'react-native': { Platform: { OS: os }, AppState: state },
      'expo-notifications': { setNotificationHandler: h => { handler = h; } },
      '../services/api': { apiService: { currentUser: null } },
      '../services/alertaPrimeiroPlano': { telaAlarmeDisponivel: () => true },
    };
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/_layout.tsx'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { exports: {}, require: name => imports[name] || {} });
    const n = id => ({ request: { content: { data: { syncmed: true, usuarioId: id, nivelAviso: 'ALARME' } } } });
    assert.equal((await handler.handleNotification(n(0))).shouldPlaySound, os === 'android');
    state.currentState = 'background';
    assert.equal((await handler.handleNotification(n(0))).shouldPlaySound, true);
    const other = await handler.handleNotification(n(9));
    assert.equal(other.shouldPlaySound, false);
    assert.equal(other.shouldShowBanner, false);
  }
});
