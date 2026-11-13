import * as Location from 'expo-location';
import type { Coordenada } from './farmacias';

export class ErroLocalizacao extends Error {
  constructor(message: string, public abrirConfiguracoes = false) { super(message); }
}

export async function obterLocalizacao(): Promise<Coordenada> {
  const atual = await Location.getForegroundPermissionsAsync();
  const permissao = atual.granted || !atual.canAskAgain ? atual : await Location.requestForegroundPermissionsAsync();
  if (!permissao.granted) throw new ErroLocalizacao(
    'Permita o acesso à localização para encontrar farmácias perto de você.', !permissao.canAskAgain);
  if (!await Location.hasServicesEnabledAsync()) throw new ErroLocalizacao(
    'A localização do aparelho está desativada. Ative-a nas configurações e tente novamente.', true);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const location = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new ErroLocalizacao(
        'Não foi possível obter sua posição a tempo. Vá para um local com melhor sinal e tente novamente.')), 20000); }),
    ]);
    return { latitude: location.coords.latitude, longitude: location.coords.longitude };
  } catch (erro) {
    if (erro instanceof ErroLocalizacao) throw erro;
    throw new ErroLocalizacao('Não foi possível obter sua localização. Verifique o GPS e tente novamente.');
  } finally { clearTimeout(timeout); }
}
