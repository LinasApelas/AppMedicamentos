const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', 'src/services', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => imports[name], setTimeout, clearTimeout, AbortController, ...globals });
  return exports;
}
(async () => {
  let calls = 0;
  let clock = 100000;
  let mode = 'ok';
  let pending;
  const fixture = { elements: [
    { type: 'node', id: 1, lat: 0, lon: 0.01, tags: { amenity: 'pharmacy', name: 'Dado de teste', 'addr:street': 'Rua Teste', 'addr:housenumber': '10' } },
    { type: 'way', id: 2, center: { lat: 0, lon: 0.002 }, tags: { healthcare: 'pharmacy' } },
    { type: 'node', id: 3, lat: 0, lon: 0.06, tags: { amenity: 'pharmacy' } },
    { type: 'node', id: 4, lat: 999, lon: 0, tags: { amenity: 'pharmacy' } },
    { type: 'node', id: 5, lat: 0, lon: 0, tags: { amenity: 'restaurant' } },
  ] };
  const f = load('farmacias.ts', {}, { Date: { now: () => clock }, fetch: async (url, options) => {
    calls++;
    assert.equal(url, 'https://overpass-api.de/api/interpreter');
    assert.equal(options.credentials, 'omit');
    assert.match(decodeURIComponent(options.body), /around:5000,0,0/);
    if (mode === 'offline') throw new TypeError('network');
    if (mode === 'abort') return new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted'))); pending = true;
    });
    return { ok: mode === 'ok', status: mode === 'busy' ? 429 : 200, json: async () => fixture };
  }, TypeError });
  const origin = { latitude: 0, longitude: 0 };
  assert.equal(f.distanciaMetros(origin, origin), 0);
  assert.ok(Math.abs(f.distanciaMetros(origin, { latitude: 0, longitude: 1 }) - 111195) < 1);
  assert.equal(f.formatarDistancia(120), '120 m');
  assert.equal(f.formatarDistancia(1500), '1,5 km');
  const rows = f.normalizarFarmacias(fixture, origin, 5);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, 'way/2');
  assert.equal(rows[1].endereco, 'Rua Teste, 10');
  assert.equal(f.normalizarFarmacias(fixture, origin, 10).length, 3);
  assert.equal(f.normalizarFarmacias({ elements: [] }, origin, 5).length, 0);
  assert.throws(() => f.normalizarFarmacias({ elements: [], remark: 'timeout' }, origin, 5), /não concluiu/);
  const search = f.criarBuscaFarmacias();
  await search(origin, 5, new AbortController().signal);
  await search(origin, 5, new AbortController().signal);
  assert.equal(calls, 1, 'cache must avoid another request');
  await assert.rejects(search(origin, 2, new AbortController().signal), /15 segundos/);
  clock += 301000;
  await search(origin, 5, new AbortController().signal);
  assert.equal(calls, 2, 'expired cache must refresh');
  mode = 'busy';
  await assert.rejects(f.criarBuscaFarmacias()(origin, 5, new AbortController().signal), /ocupado/);
  mode = 'offline';
  await assert.rejects(f.criarBuscaFarmacias()(origin, 5, new AbortController().signal), /internet/);
  mode = 'abort';
  const controller = new AbortController();
  const request = f.criarBuscaFarmacias()(origin, 5, controller.signal);
  assert.ok(pending);
  controller.abort();
  await assert.rejects(request, /aborted/);

  let permission = { granted: false, canAskAgain: false };
  let enabled = true;
  let asked = 0;
  let located = 0;
  const location = load('localizacao.ts', { 'expo-location': {
    getForegroundPermissionsAsync: async () => permission,
    requestForegroundPermissionsAsync: async () => { asked++; return permission; },
    hasServicesEnabledAsync: async () => enabled,
    getCurrentPositionAsync: async () => { located++; return { coords: origin }; },
    Accuracy: { Balanced: 3 },
  } });
  await assert.rejects(location.obterLocalizacao(), e => e.abrirConfiguracoes);
  assert.equal(asked, 0); assert.equal(located, 0);
  permission = { granted: false, canAskAgain: true };
  await assert.rejects(location.obterLocalizacao(), /Permita/);
  assert.equal(asked, 1);
  permission = { granted: true, canAskAgain: true }; enabled = false;
  await assert.rejects(location.obterLocalizacao(), /desativada/);
  enabled = true;
  assert.equal((await location.obterLocalizacao()).latitude, 0);
  assert.equal(located, 1);
  const routes = load('rotasFarmacias.ts', { './farmacias': f, 'react-native': {
    Platform: { OS: 'ios' }, Linking: { openURL: async () => { throw new Error('missing'); } },
  } });
  assert.equal(routes.urlRota({ latitude: -3, longitude: -38 }), 'https://www.google.com/maps/dir/?api=1&destination=-3,-38');
  await assert.rejects(routes.abrirRota(origin), /Google Maps/);
  for (const platform of ['ios', 'android', 'web']) {
    let opened;
    const route = load('rotasFarmacias.ts', { './farmacias': f, 'react-native': {
      Platform: { OS: platform }, Linking: { openURL: async url => { opened = url; } },
    } });
    await route.abrirRota({ latitude: -3, longitude: -38 });
    assert.equal(opened, platform === 'ios' ? 'comgooglemaps://?daddr=-3,-38' : 'https://www.google.com/maps/dir/?api=1&destination=-3,-38');
  }
  const attempts = [];
  const fallback = load('rotasFarmacias.ts', { './farmacias': f, 'react-native': {
    Platform: { OS: 'ios' }, Linking: { openURL: async url => {
      attempts.push(url);
      if (url.startsWith('comgooglemaps:')) throw new Error('App não instalado');
    } },
  } });
  await fallback.abrirRota({ latitude: -3, longitude: -38 });
  assert.equal(attempts.join('|'), 'comgooglemaps://?daddr=-3,-38|https://www.google.com/maps/dir/?api=1&destination=-3,-38');
  attempts.length = 0;
  await assert.rejects(fallback.abrirRota({ latitude: NaN, longitude: -38 }), /Destino inválido/);
  assert.equal(attempts.length, 0);
  console.log('Farmácias: distância, raio, dados, cache, erros, cancelamento, permissões e rotas OK.');
})().catch(error => { console.error(error); process.exitCode = 1; });
