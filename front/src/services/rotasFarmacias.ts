import { Linking, Platform } from 'react-native';
import { coordenadaValida, type Coordenada } from './farmacias';

export function urlRota(destino: Coordenada): string {
  if (!coordenadaValida(destino)) throw new Error('Destino inválido.');
  const coordenadas = `${destino.latitude},${destino.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${coordenadas}`;
}

export async function abrirRota(destino: Coordenada) {
  const url = urlRota(destino);
  // Chama o Google Maps diretamente no iOS, sem depender do tratamento de links HTTPS.
  if (Platform.OS === 'ios') {
    try {
      await Linking.openURL(`comgooglemaps://?daddr=${destino.latitude},${destino.longitude}`);
      return;
    } catch {
      // Sem o aplicativo instalado, ainda oferece o Google Maps pelo link web.
    }
  }
  try { await Linking.openURL(url); }
  catch { throw new Error('Não foi possível abrir o Google Maps neste aparelho.'); }
}
