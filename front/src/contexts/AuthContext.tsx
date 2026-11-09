import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { apiService, type UsuarioAutenticado } from '../services/api';
import { cancelarTodosAlarmes } from '../services/alarmes';

interface AuthState {
  user: UsuarioAutenticado | null;
  restoring: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<UsuarioAutenticado>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState(apiService.currentUser);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try { await apiService.restaurarSessao(); }
    catch {
      setError('Não foi possível validar a sessão. Verifique a conexão com o servidor e tente novamente.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = apiService.subscribe(() => {
      if (!active) return;
      setUser(apiService.currentUser);
      if (!apiService.currentUser) {
        void cancelarTodosAlarmes().catch(() => setError('Não foi possível cancelar os alarmes locais. Tente novamente.'));
      }
    });
    void (async () => {
      try {
        await cancelarTodosAlarmes();
        if (active) await refresh();
      } catch {
        if (active) setError('Não foi possível preparar a sessão. Tente novamente.');
      } finally {
        if (active) setRestoring(false);
      }
    })();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => { active = false; unsubscribe(); subscription.remove(); };
  }, [refresh]);

  const login = useCallback(async (email: string, senha: string) => {
    setError(null);
    await cancelarTodosAlarmes();
    return apiService.fazerLogin({ email: email.trim(), senha });
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try { await apiService.logout(); }
    finally { await cancelarTodosAlarmes(); }
  }, []);

  return <AuthContext.Provider value={{ user, restoring, error, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return { ...auth, isLoggedIn: auth.user !== null };
}
