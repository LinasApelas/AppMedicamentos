import Constants from 'expo-constants';
import { Platform } from 'react-native';

// No Expo Go, a API roda no mesmo computador que serve o Metro.
// EXPO_PUBLIC_API_URL permite usar um servidor separado ou um túnel da API.
const metroHost = Constants.expoConfig?.hostUri;
const host = Platform.OS === 'web' && typeof window !== 'undefined'
  ? window.location.hostname
  : metroHost ? new URL(`http://${metroHost}`).hostname
  : Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || `http://${host}:8080`).replace(/\/+$/, '');

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Usuarios
    USUARIOS: `${API_BASE_URL}/usuarios`,
    LOGIN: `${API_BASE_URL}/usuarios/login`,
    
    // Medicamentos
    MEDICAMENTOS: `${API_BASE_URL}/medicamentos`,
    
    // Tratamentos
    TRATAMENTOS: `${API_BASE_URL}/tratamentos`,
    
    // Perfis
    PERFIS: `${API_BASE_URL}/perfis`,
    
    // Históricos
    HISTORICOS: `${API_BASE_URL}/historicos`,
  },
};

export default API_CONFIG;
