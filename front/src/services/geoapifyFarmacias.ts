import { coordenadaValida, criarBuscaFarmacias, distanciaMetros, type Coordenada, type Farmacia, type RaioFarmacias } from './farmacias';

export const CATEGORIA_FARMACIA = 'commercial.health_and_beauty.pharmacy';
type Feature = { geometry?: { type?: string; coordinates?: number[] }; properties?: {
  place_id?: string; name?: string; formatted?: string; address_line2?: string; categories?: string[];
} };

export function normalizarGeoapify(dados: unknown, origem: Coordenada, raio: RaioFarmacias): Farmacia[] {
  const data = dados as { type?: string; features?: Feature[] } | null;
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features))
    throw new Error('Resposta inválida do serviço de farmácias.');
  const unicos = new Map<string, Farmacia>();
  let registrosValidos = 0;
  for (const f of data.features) {
    const p = f?.properties, coords = f?.geometry?.coordinates;
    if (f?.geometry?.type !== 'Point' || !Array.isArray(coords) || typeof p?.place_id !== 'string'
      || !Array.isArray(p.categories) || !p.categories.some(c => c === CATEGORIA_FARMACIA || c === 'healthcare.pharmacy')) continue;
    const posicao = { latitude: coords[1], longitude: coords[0] };
    if (!coordenadaValida(posicao)) continue;
    registrosValidos++;
    const distancia = distanciaMetros(origem, posicao);
    if (distancia > raio * 1000) continue;
    const id = `geoapify:${p.place_id}`;
    unicos.set(id, { id, ...posicao, distancia,
      nome: typeof p.name === 'string' && p.name.trim() ? p.name : 'Farmácia sem nome informado',
      endereco: typeof p.formatted === 'string' && p.formatted.trim() ? p.formatted
        : typeof p.address_line2 === 'string' ? p.address_line2 : 'Endereço não informado' });
  }
  if (data.features.length && !registrosValidos)
    throw new Error('Resposta sem registros válidos de farmácias.');
  return [...unicos.values()].sort((a, b) => a.distancia - b.distancia);
}

class ErroGeoapify extends Error {
  constructor(message: string, readonly fallback: boolean) { super(message); }
}

// No coordinates, URLs or credentials are logged. Native requests need no app login.
export function criarBuscaGeoapify(chave: string, alternativa = criarBuscaFarmacias()) {
  let ocupada = false, ultima = -Infinity, bloqueadoAte = 0;
  return async (origem: Coordenada, raio: RaioFarmacias, signal: AbortSignal): Promise<Farmacia[]> => {
    if (!coordenadaValida(origem) || ![2, 5, 10].includes(raio)) throw new Error('Localização ou raio inválido.');
    if (signal.aborted) throw new Error('Busca cancelada');
    if (!chave.trim()) throw new Error('Geoapify não configurada. Configure EXPO_PUBLIC_GEOAPIFY_API_KEY e reinicie o Expo.');
    if (ocupada) throw new Error('Uma busca já está em andamento. Aguarde a conclusão.');
    if (Date.now() < bloqueadoAte) throw new Error(`Limite de consultas atingido. Aguarde ${Math.ceil((bloqueadoAte - Date.now()) / 1000)} segundos.`);
    if (Date.now() - ultima < 15000) throw new Error('Aguarde 15 segundos entre novas consultas.');
    ocupada = true; ultima = Date.now();
    const controller = new AbortController();
    const cancelar = () => controller.abort();
    signal.addEventListener('abort', cancelar, { once: true });
    // Total Geoapify budget includes body reads and all pages; Overpass has its own 25s limit.
    const timer = setTimeout(cancelar, 15000);
    try {
      const resultados = new Map<string, Farmacia>();
      for (let pagina = 0; pagina < 5; pagina++) {
        if (controller.signal.aborted) throw new ErroGeoapify('Tempo de consulta excedido.', true);
        const params = new URLSearchParams({ categories: CATEGORIA_FARMACIA,
          filter: `circle:${origem.longitude},${origem.latitude},${raio * 1000}`,
          bias: `proximity:${origem.longitude},${origem.latitude}`, limit: '100', offset: String(pagina * 100), apiKey: chave.trim() });
        const r = await fetch(`https://api.geoapify.com/v2/places?${params}`, {
          signal: controller.signal, credentials: 'omit', redirect: 'error',
        });
        if (r.status === 401 || r.status === 403)
          throw new ErroGeoapify('A chave Geoapify foi recusada. Confira a configuração e as restrições do projeto.', false);
        if (r.status === 429) {
          const retry = r.headers?.get('Retry-After');
          const delay = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 30000;
          bloqueadoAte = Date.now() + (Number.isFinite(delay) ? Math.max(30000, delay) : 30000);
          throw new ErroGeoapify('Limite de consultas da Geoapify atingido. Aguarde e confira a quota do projeto.', false);
        }
        if (!r.ok) throw new ErroGeoapify('Serviço Geoapify indisponível.', r.status >= 500 || r.status === 408);
        const data = await r.json();
        if (signal.aborted) throw new Error('Busca cancelada');
        if (controller.signal.aborted) throw new ErroGeoapify('Tempo de consulta excedido.', true);
        for (const item of normalizarGeoapify(data, origem, raio)) resultados.set(item.id, item);
        if (data.features.length < 100) return [...resultados.values()].sort((a, b) => a.distancia - b.distancia);
      }
      // Never cache an incomplete circle as if it covered every pharmacy.
      throw new ErroGeoapify('Muitos resultados nesta região. Selecione um raio menor.', false);
    } catch (e) {
      if (signal.aborted) throw new Error('Busca cancelada');
      if (e instanceof ErroGeoapify && !e.fallback) throw e;
      clearTimeout(timer);
      // Network, timeout, 5xx or malformed responses may use the independent source.
      // Authentication, quota, cancellation and valid empty responses never do.
      return await alternativa(origem, raio, signal);
    } finally {
      clearTimeout(timer); signal.removeEventListener('abort', cancelar); ocupada = false;
    }
  };
}
