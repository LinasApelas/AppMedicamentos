import { coordenadaValida, criarBuscaFarmacias, distanciaMetros, type Coordenada, type Farmacia, type RaioFarmacias } from './farmacias';

export interface ArmazenamentoFarmacias {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}
type Entrada = { origem: Coordenada; raio: RaioFarmacias; data: number; items: Farmacia[] };
export type ResultadoFarmacias = {
  items: Farmacia[]; cache: boolean; desatualizado: boolean; data: number; aviso?: string;
};
const FRESCO = 5 * 60000;
const VALIDADE = 24 * 60 * 60000;

function entradaValida(e: Entrada) {
  return e && e.origem && coordenadaValida(e.origem) && [2, 5, 10].includes(e.raio)
    && Number.isFinite(e.data) && e.data <= Date.now() && Date.now() - e.data < VALIDADE
    && Array.isArray(e.items) && e.items.every(item => item && coordenadaValida(item)
      && typeof item.id === 'string' && typeof item.nome === 'string' && typeof item.endereco === 'string');
}

// Separate pharmacy-only storage; never reads the medication databases.
export function criarConsultaFarmacias(storage: ArmazenamentoFarmacias, buscar = criarBuscaFarmacias(), chave = 'resultados-v1') {
  let entradas: Entrada[] = [];
  let carregado = false;
  let ocupada = false;
  return async (origem: Coordenada, raio: RaioFarmacias, signal: AbortSignal): Promise<ResultadoFarmacias> => {
    if (!coordenadaValida(origem) || ![2, 5, 10].includes(raio)) throw new Error('Localização ou raio inválido.');
    if (signal.aborted) throw new Error('Busca cancelada');
    if (ocupada) throw new Error('Uma busca já está em andamento. Aguarde a conclusão.');
    ocupada = true;
    try {
      if (!carregado) {
        try {
          const parsed = JSON.parse(await storage.getItemAsync(chave) ?? '[]');
          entradas = Array.isArray(parsed) ? parsed.filter(entradaValida).slice(-6) : [];
        } catch { entradas = []; }
        carregado = true;
      }
      if (signal.aborted) throw new Error('Busca cancelada');
      entradas = entradas.filter(entradaValida);
      // Reuse only when the cached circle covers the entire requested circle.
      // GPS movement must never make results from another area look nearby.
      const anterior = [...entradas].reverse().find(e => distanciaMetros(e.origem, origem) + raio * 1000 <= e.raio * 1000);
      const salvos = anterior?.items.map(item => ({ ...item, distancia: distanciaMetros(origem, item) }))
        .filter(item => item.distancia <= raio * 1000).sort((a, b) => a.distancia - b.distancia) ?? [];
      if (anterior && Date.now() - anterior.data < FRESCO)
        return { items: salvos, cache: true, desatualizado: false, data: anterior.data };
      try {
        const items = await buscar(origem, raio, signal);
        if (signal.aborted) throw new Error('Busca cancelada');
        const data = Date.now();
        entradas.push({ origem, raio, data, items });
        entradas = entradas.slice(-6);
        try { await storage.setItemAsync(chave, JSON.stringify(entradas)); } catch { /* In-memory cache still works. */ }
        if (signal.aborted) throw new Error('Busca cancelada');
        return { items, cache: false, desatualizado: false, data };
      } catch (e) {
        if (signal.aborted) throw e;
        // Old empty results cannot prove absence while the server is unavailable.
        if (anterior && salvos.length) return { items: salvos, cache: true, desatualizado: true,
          data: anterior.data, aviso: e instanceof Error ? e.message : 'Serviço indisponível.' };
        throw e;
      }
    } finally { ocupada = false; }
  };
}
