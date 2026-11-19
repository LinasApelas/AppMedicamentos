import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { apiService, type UsuarioAutenticado } from '../services/api';
import { cancelarTodosAlarmes } from '../services/alarmes';

interface AuthState {
  user: UsuarioAutenticado | null;
  restoring: boolean;
  sessionVersion: number;
  error: string | null;
  login: (email: string, senha: string) => Promise<UsuarioAutenticado>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState(apiService.currentUser);
  const restoring = false;
  const [sessionVersion, setSessionVersion] = useState(apiService.getSessionVersion());
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
    let previousVersion = apiService.getSessionVersion();
    const unsubscribe = apiService.subscribe(() => {
      if (!active) return;
      if (previousVersion !== apiService.getSessionVersion()) {
        previousVersion = apiService.getSessionVersion();
        void cancelarTodosAlarmes().catch(() => setError('Não foi possível cancelar os alarmes locais. Tente novamente.'));
      }
      setUser(apiService.currentUser);
      setSessionVersion(apiService.getSessionVersion());
    });
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && apiService.currentUser) void refresh();
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
    await apiService.logout();
  }, []);

  return <AuthContext.Provider value={{ user, restoring, sessionVersion, error, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return { ...auth, isLoggedIn: auth.user !== null };
}
