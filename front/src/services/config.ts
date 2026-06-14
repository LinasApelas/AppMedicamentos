/**
 * Configuração centralizada da API
 * Altere o IP abaixo para o IP do seu servidor backend
 */

// SUBSTITUA PELO IP DO SEU SERVIDOR
const API_BASE_URL = 'http://192.168.1.14:8080';

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
