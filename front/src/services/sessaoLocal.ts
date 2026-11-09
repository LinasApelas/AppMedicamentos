import { apiService } from './api';

// Identifica a sessão que abriu um banco local. Não é uma credencial de acesso.
export interface SessaoLocal {
  usuarioId: number;
  versao: number;
}

export function capturarSessaoLocal(): SessaoLocal {
  return { usuarioId: apiService.requireUserId(), versao: apiService.getSessionVersion() };
}

export function sessaoLocalAtual(sessao: SessaoLocal): boolean {
  return apiService.isSessionCurrent(sessao.versao);
}

export function validarSessaoLocal(sessao: SessaoLocal): void {
  if (!sessaoLocalAtual(sessao) || apiService.requireUserId() !== sessao.usuarioId) {
    throw new Error('A sessão mudou. Abra novamente os lembretes.');
  }
}
