/**
 * Serviço centralizado para todas as chamadas à API
 * Abstrai o fetch e fornece métodos reutilizáveis
 */

import API_CONFIG from './config';
import { sessionStorage } from './session-storage';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  fusoHorario?: string;
  perfis?: { id: number; nome: string; corAvatar?: string }[];
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private user: UsuarioAutenticado | null = null;
  private sessionVersion = 0;
  private listeners = new Set<() => void>();
  private requests = new Set<AbortController>();
  private authQueue: Promise<unknown> = Promise.resolve();

  get currentUser() { return this.user; }
  getSessionVersion() { return this.sessionVersion; }
  isSessionCurrent(version: number) { return version === this.sessionVersion && this.user !== null; }
  requireUserId() {
    if (!this.user) throw new ApiError(401, 'Faça login para continuar.');
    return this.user.id;
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private setUser(user: UsuarioAutenticado | null, invalidate = false) {
    if (invalidate || this.user?.id !== user?.id) {
      this.sessionVersion++;
      for (const controller of this.requests) controller.abort();
    }
    this.user = user;
    for (const listener of this.listeners) listener();
  }

  private authOperation<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.authQueue.then(operation, operation);
    this.authQueue = result.catch(() => undefined);
    return result;
  }

// realiza uma chamada http generica
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
    publicRequest = false
  ): Promise<T> {
    const version = this.sessionVersion;
    if (!publicRequest) this.requireUserId();
    const {
      method = 'GET',
      body,
      headers = {},
    } = options;

    const requestOptions: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-SyncMed-Client': '1',
        ...(!publicRequest ? { 'X-SyncMed-User': String(this.requireUserId()) } : {}),
        ...headers,
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    if (!publicRequest) this.requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), 10000);
    requestOptions.signal = controller.signal;
    try {
      const response = await fetch(endpoint, requestOptions);
      if (version !== this.sessionVersion) throw new ApiError(401, 'A sessão mudou.');

      // Se a resposta não é ok mas não tem corpo, retornar null ou string
      if (!response.ok) {
        if (response.status === 401 && !publicRequest) this.setUser(null, true);
        let errorMessage = `Erro ${response.status}`;
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          errorMessage = `${errorMessage}: ${errorData.message || errorData.error || text}`;
        } catch {
          if (text) errorMessage = `${errorMessage}: ${text}`;
        }
        throw new ApiError(response.status, errorMessage);
      }

      // Tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (version !== this.sessionVersion) throw new ApiError(401, 'A sessão mudou.');
        return result;
      }

      // Se não for JSON, retornar o texto
      const result = await response.text();
      if (version !== this.sessionVersion) throw new ApiError(401, 'A sessão mudou.');
      return result as unknown as T;
    } finally {
      clearTimeout(timeout);
      this.requests.delete(controller);
    }
  }

  // ===== USUARIOS =====
  async criarUsuario(userData: {
    nome: string;
    email: string;
    senha: string;
    fusoHorario?: string;
  }): Promise<string> {
    return this.request(API_CONFIG.ENDPOINTS.USUARIOS, {
      method: 'POST',
      body: userData,
    }, true);
  }

  async fazerLogin(credentials: {
    email: string;
    senha: string;
  }): Promise<UsuarioAutenticado> {
    return this.authOperation(async () => {
      this.setUser(null, true);
      await this.concluirLogoutPendente();
      const usuario = await this.request<UsuarioAutenticado>(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: credentials,
      }, true);
      // Confirma que o cliente devolve o cookie e que o servidor reconhece a sessão.
      const confirmado = await this.request<UsuarioAutenticado>(API_CONFIG.ENDPOINTS.SESSAO, {}, true);
      if (confirmado.id !== usuario.id) throw new ApiError(401, 'Não foi possível confirmar a sessão.');
      this.setUser(confirmado);
      return confirmado;
    });
  }

  private async concluirLogoutPendente() {
    if (await sessionStorage.logoutPendente()) {
      await this.request(API_CONFIG.ENDPOINTS.LOGOUT, { method: 'POST' }, true);
      await sessionStorage.concluirLogout();
    }
  }

  restaurarSessao(): Promise<UsuarioAutenticado | null> {
    return this.authOperation(async () => {
      if (await sessionStorage.logoutPendente()) {
        this.setUser(null, true);
        await this.concluirLogoutPendente();
        return null;
      }
      try {
        const usuario = await this.request<UsuarioAutenticado>(API_CONFIG.ENDPOINTS.SESSAO, {}, true);
        this.setUser(usuario);
        return usuario;
      } catch (error) {
        this.setUser(null);
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    });
  }

  logout(): Promise<void> {
    return this.authOperation(async () => {
      await sessionStorage.marcarLogout();
      this.setUser(null, true);
      await this.concluirLogoutPendente();
    });
  }

  async listarUsuarios(): Promise<any[]> {
    return this.request(API_CONFIG.ENDPOINTS.USUARIOS, {
      method: 'GET',
    });
  }

  async atualizarUsuario(
    id: number,
    userData: Partial<{
      nome: string;
      email: string;
      senha: string;
      fusoHorario: string;
    }>
  ): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.USUARIOS}/${id}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async deletarUsuario(id: number): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.USUARIOS}/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== MEDICAMENTOS =====
  async criarMedicamento(medicamentoData: {
    nome: string;
    unidadeMedida: string;
    descricao?: string;
  }): Promise<any> {
    return this.request(API_CONFIG.ENDPOINTS.MEDICAMENTOS, {
      method: 'POST',
      body: medicamentoData,
    });
  }

  async listarMedicamentos(): Promise<any[]> {
    return this.request(API_CONFIG.ENDPOINTS.MEDICAMENTOS, {
      method: 'GET',
    });
  }

  async atualizarMedicamento(
    id: number,
    medicamentoData: Partial<{
      nome: string;
      unidadeMedida: string;
      descricao: string;
    }>
  ): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.MEDICAMENTOS}/${id}`, {
      method: 'PUT',
      body: medicamentoData,
    });
  }

  async deletarMedicamento(id: number): Promise<string> {
    try {
      return await this.request(`${API_CONFIG.ENDPOINTS.MEDICAMENTOS}/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Já excluído no servidor: a exclusão local ainda deve prosseguir.
      if (error instanceof ApiError && error.status === 404) return '';
      throw error;
    }
  }

  // ===== TRATAMENTOS =====
  async criarTratamento(tratamentoData: any): Promise<string> {
    return this.request(API_CONFIG.ENDPOINTS.TRATAMENTOS, {
      method: 'POST',
      body: tratamentoData,
    });
  }

  async listarTratamentos(): Promise<any[]> {
    return this.request(API_CONFIG.ENDPOINTS.TRATAMENTOS, {
      method: 'GET',
    });
  }

  async atualizarTratamento(
    id: number,
    tratamentoData: any
  ): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.TRATAMENTOS}/${id}`, {
      method: 'PUT',
      body: tratamentoData,
    });
  }

  async deletarTratamento(id: number): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.TRATAMENTOS}/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== PERFIS =====
  async criarPerfil(perfilData: {
    nome: string;
    usuarioId?: number;
    corAvatar?: string;
  }): Promise<string> {
    return this.request(API_CONFIG.ENDPOINTS.PERFIS, {
      method: 'POST',
      body: perfilData,
    });
  }

  async listarPerfis(): Promise<any[]> {
    return this.request(API_CONFIG.ENDPOINTS.PERFIS, {
      method: 'GET',
    });
  }

  async atualizarPerfil(
    id: number,
    perfilData: Partial<{
      nome: string;
      usuarioId: number;
      corAvatar: string;
    }>
  ): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.PERFIS}/${id}`, {
      method: 'PUT',
      body: perfilData,
    });
  }

  async deletarPerfil(id: number): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.PERFIS}/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== HISTÓRICOS =====
  async criarHistorico(historicoData: any): Promise<string> {
    return this.request(API_CONFIG.ENDPOINTS.HISTORICOS, {
      method: 'POST',
      body: historicoData,
    });
  }

  async listarHistoricos(): Promise<any[]> {
    return this.request(API_CONFIG.ENDPOINTS.HISTORICOS, {
      method: 'GET',
    });
  }

  async atualizarHistorico(id: number, historicoData: any): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.HISTORICOS}/${id}`, {
      method: 'PUT',
      body: historicoData,
    });
  }

  async deletarHistorico(id: number): Promise<string> {
    return this.request(`${API_CONFIG.ENDPOINTS.HISTORICOS}/${id}`, {
      method: 'DELETE',
    });
  }
}

// Exportar instância singleton
export const apiService = new ApiService();
export default apiService;
