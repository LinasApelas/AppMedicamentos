const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarURL, consultar } = require('../scripts/testar-geoapify.cjs');

test('Geoapify: categoria, ordem lon/lat, raio e ausência de chave', async () => {
  const u = criarURL('fixture-only', -3, -38, 2000);
  assert.equal(u.searchParams.get('categories'), 'commercial.health_and_beauty.pharmacy');
  assert.equal(u.searchParams.get('filter'), 'circle:-38,-3,2000');
  assert.equal(u.searchParams.get('bias'), 'proximity:-38,-3');
  assert.equal(u.searchParams.get('limit'), '20');
  let chamadas = 0;
  await assert.rejects(consultar({ chave: '', fetchImpl: async () => chamadas++ }), /Configure/);
  assert.equal(chamadas, 0);
  assert.throws(() => criarURL('fixture', 91, 0, 2000), /inválidos/);
});

test('Geoapify: resposta válida, vazia, erro HTTP e logs sem credenciais', async () => {
  const chave = 'test-secret-not-real';
  const feature = { geometry: { type: 'Point', coordinates: [-38, -3] },
    properties: { place_id: 'fixture', name: 'Fixture de teste', categories: ['commercial.health_and_beauty.pharmacy'] } };
  const success = await consultar({ chave, fetchImpl: async () => ({ ok: true, status: 200,
    json: async () => ({ type: 'FeatureCollection', features: [feature] }) }) });
  assert.equal(success.ok, true); assert.equal(success.farmaciasValidas, 1);
  const empty = await consultar({ chave, fetchImpl: async () => ({ ok: true, status: 200,
    json: async () => ({ type: 'FeatureCollection', features: [] }) }) });
  assert.equal(empty.ok, false);
  for (const status of [401, 403, 429, 502]) {
    const result = await consultar({ chave, fetchImpl: async () => ({ ok: false, status }) });
    assert.equal(result.ok, false); assert.equal(result.status, status);
    assert.ok(!JSON.stringify(result).includes(chave));
  }
  const failure = await consultar({ chave, fetchImpl: async () => { throw new Error(chave); } });
  assert.equal(failure.ok, false); assert.ok(!JSON.stringify(failure).includes(chave));
});
