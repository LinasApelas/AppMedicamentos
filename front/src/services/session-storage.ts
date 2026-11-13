import Storage from 'expo-sqlite/kv-store';
import { API_CONFIG } from './config';

// Somente a intenção de sair é persistida aqui; nunca senha, cookie ou usuário.
// Se a rede cair no logout, o próximo início não pode restaurar essa sessão.
const logoutKey = `syncmed:logout-pendente:${API_CONFIG.BASE_URL}`;

export const sessionStorage = {
  logoutPendente: async () => (await Storage.getItem(logoutKey)) === '1',
  marcarLogout: () => Storage.setItem(logoutKey, '1'),
  concluirLogout: () => Storage.removeItem(logoutKey),
};
