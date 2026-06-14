import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

//hook para carregar dados assincronamente
export function useApiData<T>(
  fetchFunction: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  // Executar na primeira vez que o hook for montado
  useState(() => {
    refetch();
  });

  return { data, loading, error, refetch };
}

export function useApiMutation<TInput, TOutput>(
  mutationFunction: (input: TInput) => Promise<TOutput>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFunction(input);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mutationFunction]
  );

  return { execute, loading, error };
}

// hook para gerenciar a sincronização do usuario
export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      const usuarioLogado = await apiService.fazerLogin({ email, senha });
      setUser(usuarioLogado);
      setIsLoggedIn(true);
      return usuarioLogado;
    } catch (error) {
      setIsLoggedIn(false);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return { user, isLoggedIn, login, logout };
}
