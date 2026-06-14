/**
 * Serviço centralizado para todas as chamadas à API
 * Abstrai o fetch e fornece métodos reutilizáveis
 */

import API_CONFIG from './config';

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  public currentUser: any | null = null;

// realiza uma chamada http generica
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
    } = options;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(endpoint, requestOptions);

      // Se a resposta não é ok mas não tem corpo, retornar null ou string
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      // Tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      // Se não for JSON, retornar o texto
      return (await response.text()) as unknown as T;
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      throw error;
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
    });
  }

  async fazerLogin(credentials: {
    email: string;
    senha: string;
  }): Promise<any> {
    const usuario = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: credentials,
    });
    this.currentUser = usuario;
    return usuario;
  }

  logout() {
    this.currentUser = null;
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
    return this.request(`${API_CONFIG.ENDPOINTS.MEDICAMENTOS}/${id}`, {
      method: 'DELETE',
    });
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
