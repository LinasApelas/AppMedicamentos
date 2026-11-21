const path = require('node:path');

const CATEGORIA = 'commercial.health_and_beauty.pharmacy';
function criarURL(chave, latitude, longitude, raio) {
  if (!chave?.trim()) throw new Error('Configure GEOAPIFY_API_KEY em front/.env.local antes do teste.');
  if (![latitude, longitude, raio].every(Number.isFinite) || Math.abs(latitude) > 90
      || Math.abs(longitude) > 180 || raio <= 0 || raio > 10000) throw new Error('Coordenadas ou raio inválidos (máximo 10000 m).');
  const url = new URL('https://api.geoapify.com/v2/places');
  url.searchParams.set('categories', CATEGORIA);
  url.searchParams.set('filter', `circle:${longitude},${latitude},${raio}`);
  url.searchParams.set('bias', `proximity:${longitude},${latitude}`);
  url.searchParams.set('limit', '20'); // One bounded probe; not an exhaustive area download.
  url.searchParams.set('apiKey', chave.trim());
  return url;
}

async function consultar({ chave, latitude = -3.7319, longitude = -38.5267, raio = 2000, fetchImpl = fetch }) {
  const url = criarURL(chave, latitude, longitude, raio);
  const start = Date.now();
  let resposta, data;
  try {
    resposta = await fetchImpl(url, { signal: AbortSignal.timeout(15000), credentials: 'omit', redirect: 'error' });
    if (!resposta.ok) {
      const erros = { 401: 'Chave ausente ou inválida', 403: 'Chave sem acesso ou restrição incompatível',
        429: 'Limite atingido; respeite Retry-After e a quota do projeto' };
      return { ok: false, status: resposta.status, motivo: erros[resposta.status] ?? 'Serviço indisponível ou requisição recusada' };
    }
    data = await resposta.json();
  } catch {
    // Never print request URLs, keys, coordinates or raw provider error bodies.
    return { ok: false, motivo: 'Falha de conexão, timeout ou resposta JSON inválida.' };
  }
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features))
    return { ok: false, status: resposta.status, motivo: 'Resposta GeoJSON inválida.' };
  const validos = data.features.filter(f => f?.geometry?.type === 'Point'
    && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length >= 2
    && Number.isFinite(f.geometry.coordinates[0]) && Math.abs(f.geometry.coordinates[0]) <= 180
    && Number.isFinite(f.geometry.coordinates[1]) && Math.abs(f.geometry.coordinates[1]) <= 90
    && typeof f.properties?.place_id === 'string'
    && Array.isArray(f.properties.categories) && f.properties.categories.includes(CATEGORIA));
  return { ok: validos.length > 0, status: resposta.status, ms: Date.now() - start,
    recebidos: data.features.length, farmaciasValidas: validos.length,
    amostraLimitada: data.features.length === 20,
    nomes: validos.slice(0, 3).map(f => typeof f.properties.name === 'string' ? f.properties.name : 'Nome não informado'),
    motivo: !validos.length ? 'Sem farmácias válidas nesta amostra; não aprova a integração.' : 'Resposta real recebida; ainda requer normalização completa e teste nos aparelhos.' };
}

async function main() {
  try { process.loadEnvFile(path.join(__dirname, '../.env.local')); }
  catch (e) { if (e.code !== 'ENOENT') throw new Error('Não foi possível ler front/.env.local.'); }
  const chave = process.env.GEOAPIFY_API_KEY || process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!chave?.trim()) {
    console.log('TESTE NÃO EXECUTADO: falta GEOAPIFY_API_KEY em front/.env.local. Nenhuma requisição enviada.');
    process.exitCode = 2; return;
  }
  const args = process.argv.slice(2);
  if (args.length !== 0 && args.length !== 3) throw new Error('Uso: node scripts/testar-geoapify.cjs [latitude longitude raioEmMetros]');
  const resultado = await consultar({ chave, ...(args.length ? {
    latitude: Number(args[0]), longitude: Number(args[1]), raio: Number(args[2]),
  } : {}) });
  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exitCode = 1;
}

module.exports = { criarURL, consultar };
if (require.main === module) main().catch(() => {
  console.error('Teste interrompido. Confira arquivo de configuração e argumentos; detalhes sensíveis omitidos.');
  process.exitCode = 1;
});
