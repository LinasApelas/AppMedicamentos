import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { criarConsultaFarmacias } from './cacheFarmacias';
import { criarBuscaGeoapify } from './geoapifyFarmacias';

// Keep cache/throttling when navigating away and back. Never log coordinates.
export const consultarFarmacias = criarConsultaFarmacias(new SQLiteStorage('syncmed-farmacias-cache.db'),
  criarBuscaGeoapify(process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? ''), 'geoapify-overpass-v2');
