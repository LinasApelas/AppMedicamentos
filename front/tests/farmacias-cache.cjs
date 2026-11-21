const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');

function load(file, imports, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: false },
  }).outputText;
  vm.runInNewContext(code, { exports, require: n => imports[n], ...globals });
  return exports;
}
test('cache persistido: validade, raio, região, falha, cancelamento e vazio antigo', async () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'syncmed-farmacias-'));
  const file = path.join(dir, 'cache.db');
  let db = new DatabaseSync(file);
  db.exec('CREATE TABLE cache (key TEXT PRIMARY KEY, value TEXT)');
  const storage = { getItemAsync: async k => db.prepare('SELECT value FROM cache WHERE key=?').get(k)?.value ?? null,
    setItemAsync: async (k,v) => db.prepare('INSERT OR REPLACE INTO cache VALUES (?,?)').run(k,v) };
  let clock = 1000000, calls = 0, fail = false, empty = false;
  const base = load('services/farmacias.ts', {});
  const origin = { latitude: 0, longitude: 0 };
  const factory = load('services/cacheFarmacias.ts', { './farmacias': { ...base, criarBuscaFarmacias: () => async () => {
    calls++; if (fail) throw new Error('Servidor indisponível');
    return empty ? [] : [{ id: 'node/1', nome: 'Fixture', endereco: 'Teste', latitude: 0, longitude: 0.01, distancia: 1112 }];
  } } }, { Date: { now: () => clock } }).criarConsultaFarmacias;
  const signal = new AbortController().signal;
  try {
    let search = factory(storage);
    const live = await search(origin, 5, signal); assert.equal(live.cache, false);
    db.close(); db = new DatabaseSync(file); search = factory(storage);
    const saved = await search(origin, 2, signal);
    assert.equal(saved.cache, true); assert.equal(calls, 1);
    clock += 301000; fail = true;
    const old = await search(origin, 2, signal);
    assert.equal(old.desatualizado, true); assert.match(old.aviso, /indisponível/);
    await assert.rejects(search({ latitude: 10, longitude: 10 }, 2, signal), /indisponível/);
    await assert.rejects(search(origin, 10, signal), /indisponível/);
    const abort = new AbortController(); abort.abort();
    await assert.rejects(search(origin, 2, abort.signal), /cancelada/);
    clock += 24 * 3600000;
    await assert.rejects(search(origin, 2, signal), /indisponível/);
    fail = false; empty = true;
    assert.equal((await search(origin, 2, signal)).items.length, 0);
    clock += 301000; fail = true;
    await assert.rejects(search(origin, 2, signal), /indisponível/);
  } finally { db.close(); fs.rmSync(dir, { recursive: true }); }
});

test('mapa e cartão: mesmos dados, marcadores selecionáveis e seleção sem saída externa', () => {
  const jsx = (type, props, key) => ({ type, props, key });
  const imports = { 'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { useRef: () => ({ current: null }), useState: () => [false, () => {}], useEffect: () => {} },
    'react-native-maps': { default: 'Map', Marker: 'Marker', Circle: 'Circle' },
    'react-native': { Pressable: 'Pressable', View: 'View', Text: 'Text', StyleSheet: { create: x => x } },
    '@expo/vector-icons': { MaterialIcons: 'Icon' },
    '../../services/farmacias': { formatarDistancia: n => `${n} m` } };
  const Component = load('components/farmacias/MapaFarmacias.tsx', imports).default;
  const Card = load('components/farmacias/ItemFarmacia.tsx', imports).default;
  const items = [{ id: 'node/1', nome: 'Fixture', endereco: 'Teste', latitude: -3, longitude: -38, distancia: 100 }];
  for (const platform of ['android', 'ios']) {
    imports['react-native'].Platform = { OS: platform };
    let selected, routes = 0;
    const tree = Component({ origem: items[0], farmacias: items, raio: 2, selecionada: null, onSelecionar: id => selected = id });
    const markers = tree.props.children[1];
    assert.equal(markers.length, items.length);
    assert.equal(markers[0].props.coordinate.latitude, items[0].latitude);
    assert.equal(markers[0].props.title, items[0].nome);
    markers[0].props.onPress(); assert.equal(selected, items[0].id);
    const card = Card({ item: items[0], posicao: 1, selecionada: false,
      onSelecionar: () => selected = 'card', onRota: () => routes++ });
    card.props.children[0].props.onPress();
    assert.equal(selected, 'card'); assert.equal(routes, 0);
  }
});
