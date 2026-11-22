const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(name, imports = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services', name + '.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: n => imports[n], AbortController, URLSearchParams, setTimeout, clearTimeout, ...globals });
  return exports;
}
const base = load('farmacias');
const origin = { latitude: 0, longitude: 0 };
const categoria = 'commercial.health_and_beauty.pharmacy';
const feature = (id, lon = 0.01) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, 0] },
  properties: { place_id: id, name: 'Fixture', formatted: 'Endereço de teste', categories: [categoria] } });
const collection = features => ({ type: 'FeatureCollection', features });
const success = features => ({ status: 200, ok: true, json: async () => collection(features) });
const service = globals => load('geoapifyFarmacias', { './farmacias': base }, globals);

test('Geoapify normaliza, deduplica, ordena e filtra 2/5/10 km', () => {
  const normalizar = service().normalizarGeoapify;
  const data = collection([feature('a'), feature('a'), feature('b', 0.03), feature('c', 0.07), feature('bad', 999)]);
  assert.equal(normalizar(data, origin, 2).length, 1);
  assert.equal(normalizar(data, origin, 5).length, 2);
  assert.equal(normalizar(data, origin, 10).length, 3);
  const item = normalizar(data, origin, 2)[0];
  assert.equal(item.id, 'geoapify:a'); assert.equal(item.latitude, 0); assert.equal(item.longitude, 0.01);
  assert.equal(item.endereco, 'Endereço de teste'); assert.ok(item.distancia > 1100 && item.distancia < 1120);
  assert.throws(() => normalizar({}, origin, 2), /inválida/);
  assert.throws(() => normalizar(collection([feature('bad', 999), null]), origin, 2), /sem registros válidos/);
  assert.equal(normalizar(collection([]), origin, 2).length, 0);
  assert.equal(normalizar(collection([feature('fora', 0.07)]), origin, 2).length, 0);
});

test('Geoapify principal, paginação sequencial e vazio não aciona Overpass', async () => {
  const urls = []; let fallback = 0;
  const api = service({ fetch: async url => {
    urls.push(new URL(url));
    return urls.length === 1 ? success(Array.from({ length: 100 }, (_, i) => feature(String(i)))) : success([feature('last')]);
  } });
  const rows = await api.criarBuscaGeoapify('fixture-key', async () => { fallback++; return []; })(origin, 2, new AbortController().signal);
  assert.equal(rows.length, 101); assert.equal(fallback, 0);
  assert.equal(urls[0].searchParams.get('filter'), 'circle:0,0,2000');
  assert.equal(urls[0].searchParams.get('categories'), categoria);
  assert.equal(urls[1].searchParams.get('offset'), '100');
  const empty = service({ fetch: async () => success([]) }).criarBuscaGeoapify('fixture-key', async () => { throw Error('não deve usar fallback'); });
  assert.equal((await empty(origin, 2, new AbortController().signal)).length, 0);
});

test('Geoapify: fallback em rede/5xx/JSON; 401/403/429 não contornam restrições', async () => {
  for (const status of [408, 502, 503, 504, 'network', 'json', 'malformed']) {
    let fallback = 0;
    const search = service({ fetch: async () => {
      if (status === 'network') throw Error('network');
      if (status === 'malformed') return success([feature('bad', 999)]);
      if (status === 'json') return { ok: true, json: async () => { throw Error('json'); } };
      return { ok: false, status };
    } }).criarBuscaGeoapify('fixture', async () => { fallback++; return []; });
    await search(origin, 2, new AbortController().signal); assert.equal(fallback, 1);
  }
  for (const status of [401, 403, 429]) {
    let calls = 0;
    const search = service({ fetch: async () => { calls++; return { ok: false, status, headers: { get: () => '120' } }; } })
      .criarBuscaGeoapify('fixture', async () => { throw Error('fallback proibido'); });
    await assert.rejects(search(origin, 2, new AbortController().signal), status === 429 ? /Limite/ : /recusada/);
    if (status === 429) await assert.rejects(search(origin, 2, new AbortController().signal), /120 segundos/);
    assert.equal(calls, 1);
  }
});

test('Geoapify: cancelamento, timeout, concorrência e chave ausente', async () => {
  let fallback = 0, timeout;
  const api = service({ setTimeout: cb => { timeout = cb; return 1; }, clearTimeout: () => {},
    fetch: async (_url, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Error('abort')))) });
  const search = api.criarBuscaGeoapify('fixture', async () => { fallback++; return []; });
  const controller = new AbortController();
  const promise = search(origin, 2, controller.signal);
  await assert.rejects(search(origin, 2, new AbortController().signal), /em andamento/);
  controller.abort(); await assert.rejects(promise, /cancelada/); assert.equal(fallback, 0);
  const delayed = api.criarBuscaGeoapify('fixture', async () => { fallback++; return []; })(origin, 2, new AbortController().signal);
  timeout(); await delayed; assert.equal(fallback, 1);
  await assert.rejects(api.criarBuscaGeoapify('')(origin, 2, new AbortController().signal), /não configurada/);
});

test('Geoapify: limite de paginação não salva círculo parcial; cache integrado evita HTTP', async () => {
  let count = 0;
  const full = service({ fetch: async () => { count++; return success(Array.from({ length: 100 }, (_, i) => feature(String(i)))); } })
    .criarBuscaGeoapify('fixture', async () => { throw Error('fallback proibido'); });
  await assert.rejects(full(origin, 10, new AbortController().signal), /raio menor/); assert.equal(count, 5);
  let requests = 0; const saved = new Map();
  const buscar = service({ fetch: async () => { requests++; return success([feature('a')]); } }).criarBuscaGeoapify('fixture');
  const cache = load('cacheFarmacias', { './farmacias': base }).criarConsultaFarmacias;
  const storage = { getItemAsync: async k => saved.get(k) ?? null, setItemAsync: async (k,v) => saved.set(k,v) };
  const query = cache(storage, buscar, 'geoapify-overpass-v2');
  assert.equal((await query(origin, 5, new AbortController().signal)).items[0].id, 'geoapify:a');
  const reaberto = cache(storage, buscar, 'geoapify-overpass-v2');
  assert.equal((await reaberto(origin, 2, new AbortController().signal)).cache, true);
  assert.equal(requests, 1);
});
