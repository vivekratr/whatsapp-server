import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, clearToken, setToken, type AuthUser } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('wa_token');
    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback((token: string, authUser: AuthUser) => {
    setToken(token);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    void authApi.logout().catch(() => undefined);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
