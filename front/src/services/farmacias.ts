export interface Coordenada { latitude: number; longitude: number }
export interface Farmacia extends Coordenada {
  id: string;
  nome: string;
  endereco: string;
  distancia: number;
}
export type RaioFarmacias = 2 | 5 | 10;

export function coordenadaValida(p: Coordenada): boolean {
  return Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
    && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
}

export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const rad = (n: number) => n * Math.PI / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function formatarDistancia(metros: number): string {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

type Elemento = {
  type: string; id: number; lat?: number; lon?: number;
  center?: { lat: number; lon: number }; tags?: Record<string, string>;
};

export function normalizarFarmacias(dados: unknown, origem: Coordenada, raio: RaioFarmacias): Farmacia[] {
  const resposta = dados as { elements?: Elemento[]; remark?: string } | null;
  // Overpass can return HTTP 200 with partial data and a timeout remark.
  if (!resposta || resposta.remark || !Array.isArray(resposta.elements)) {
    throw new Error('O serviço não concluiu a busca. Tente novamente mais tarde.');
  }
  const unicos = new Map<string, Farmacia>();
  for (const item of resposta.elements) {
    if (!item || !Number.isFinite(item.id) || !['node', 'way', 'relation'].includes(item.type)) continue;
    const tags = item.tags ?? {};
    if (tags.amenity !== 'pharmacy' && tags.healthcare !== 'pharmacy') continue;
    const posicao = { latitude: item.lat ?? item.center?.lat ?? NaN, longitude: item.lon ?? item.center?.lon ?? NaN };
    if (!coordenadaValida(posicao)) continue;
    const distancia = distanciaMetros(origem, posicao);
    if (distancia > raio * 1000) continue;
    const rua = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ');
    const endereco = tags['addr:full'] || [rua, tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(' — ');
    const id = `${item.type}/${item.id}`;
    unicos.set(id, { id, ...posicao, nome: tags.name || tags.brand || 'Farmácia sem nome no mapa',
      endereco: endereco || 'Endereço não informado no OpenStreetMap', distancia });
  }
  return [...unicos.values()].sort((a, b) => a.distancia - b.distancia);
}

// Each screen owns its short-lived cache. No coordinates are persisted or logged.
export function criarBuscaFarmacias() {
  const cache = new Map<string, { data: number; items: Farmacia[]; origem: string; raio: RaioFarmacias }>();
  let ultimaConsulta = -Infinity;
  let indisponivelAte = 0;
  let emAndamento = false;
  // Independent operators; do not treat kumi.systems as another provider:
  // it is an alias of Private.coffee. Prefer the last successful endpoint.
  let servidores = ['https://overpass.private.coffee/api/interpreter', 'https://overpass-api.de/api/interpreter'];
  return async (origem: Coordenada, raio: RaioFarmacias, signal: AbortSignal): Promise<Farmacia[]> => {
    if (!coordenadaValida(origem) || ![2, 5, 10].includes(raio)) throw new Error('Localização ou raio inválido.');
    if (signal.aborted) throw new Error('Busca cancelada');
    const posicao = `${origem.latitude},${origem.longitude}`;
    const key = `${origem.latitude},${origem.longitude},${raio}`;
    const anterior = cache.get(key);
    if (anterior && Date.now() - anterior.data < 5 * 60000) return anterior.items;
    for (const entrada of cache.values()) {
      if (entrada.origem === posicao && entrada.raio >= raio && Date.now() - entrada.data < 5 * 60000)
        return entrada.items.filter(item => item.distancia <= raio * 1000);
    }
    if (emAndamento) throw new Error('Uma busca já está em andamento. Aguarde a conclusão.');
    if (Date.now() < indisponivelAte) throw new Error(`O serviço está ocupado. Aguarde ${Math.ceil((indisponivelAte - Date.now()) / 1000)} segundos e tente novamente.`);
    if (Date.now() - ultimaConsulta < 15000) throw new Error('Aguarde 15 segundos entre novas consultas.');
    ultimaConsulta = Date.now();
    emAndamento = true;
    const controller = new AbortController();
    const cancelar = () => controller.abort();
    if (signal.aborted) controller.abort();
    signal.addEventListener('abort', cancelar, { once: true });
    const timeout = setTimeout(cancelar, 25000);
    try {
      const query = `[out:json][timeout:8];(nwr["amenity"="pharmacy"](around:${raio * 1000},${origem.latitude},${origem.longitude});nwr["healthcare"="pharmacy"](around:${raio * 1000},${origem.latitude},${origem.longitude}););out center tags;`;
      let items: Farmacia[] | undefined;
      for (let tentativa = 0; tentativa < servidores.length; tentativa++) {
        if (controller.signal.aborted) throw new Error('Busca cancelada');
        let resposta: Response;
        let dados: unknown;
        const requisicao = new AbortController();
        const cancelarRequisicao = () => requisicao.abort();
        controller.signal.addEventListener('abort', cancelarRequisicao, { once: true });
        const prazo = setTimeout(cancelarRequisicao, 11000);
        try {
          resposta = await fetch(servidores[tentativa], {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'SyncMed/1.0 (+https://github.com/LinasApelas/AppMedicamentos)' },
            body: `data=${encodeURIComponent(query)}`, signal: requisicao.signal,
            credentials: 'omit',
          });
          if (resposta.ok) dados = await resposta.json();
        } catch (erro) {
          if ((erro instanceof TypeError || erro instanceof SyntaxError || requisicao.signal.aborted) && !controller.signal.aborted && tentativa === 0) continue;
          if (requisicao.signal.aborted && !controller.signal.aborted)
            throw new Error('Os servidores de farmácias demoraram para responder. Tente novamente mais tarde.');
          throw erro;
        } finally {
          clearTimeout(prazo);
          controller.signal.removeEventListener('abort', cancelarRequisicao);
        }
        if (controller.signal.aborted) throw new Error('Busca cancelada');
        if ((resposta.status >= 500 || resposta.status === 408) && tentativa === 0) continue;
        if (resposta.status === 429 || resposta.status === 406) {
          const retry = resposta.headers?.get('Retry-After');
          const delay = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 30000;
          const espera = Number.isFinite(delay) ? Math.max(30000, delay) : 30000;
          indisponivelAte = Date.now() + espera;
          throw new Error(`Limite de consultas atingido. O serviço está ocupado. Aguarde ${Math.ceil(espera / 1000)} segundos e tente novamente.`);
        }
        if (!resposta.ok) throw new Error('O serviço de farmácias está indisponível no momento. O mapa pode continuar disponível. Tente um raio menor ou tente novamente mais tarde.');
        try { items = normalizarFarmacias(dados, origem, raio); }
        catch (erro) {
          if (tentativa === 0) continue;
          throw erro;
        }
        servidores = [servidores[tentativa], ...servidores.filter((_, index) => index !== tentativa)];
        break;
      }
      if (!items) throw new Error('Não foi possível consultar as farmácias. Tente novamente mais tarde.');
      if (cache.size >= 6) cache.clear();
      cache.set(key, { data: Date.now(), items, origem: posicao, raio });
      return items;
    } catch (erro) {
      if (signal.aborted) throw erro;
      indisponivelAte = Math.max(indisponivelAte, Date.now() + 30000);
      if (controller.signal.aborted) throw new Error('A busca demorou demais. Os servidores podem estar sobrecarregados. Tente novamente mais tarde.');
      if (erro instanceof TypeError) throw new Error('Falha de conexão com os serviços de farmácias. Verifique sua internet. Isso não significa que não há farmácias no local.');
      if (erro instanceof SyntaxError) throw new Error('O serviço de farmácias enviou uma resposta inválida. Tente novamente mais tarde.');
      throw erro;
    } finally {
      emAndamento = false;
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancelar);
    }
  };
}
