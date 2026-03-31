import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import type { LoginRequest, RegisterRequest } from '../types/user';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    authService.isAuthenticated(),
  );
  const [isAdmin, setIsAdmin] = useState(() => authService.isAdmin());
  const [isSeller, setIsSeller] = useState(() => authService.isSeller());

  // Re-sync state if cookies change (e.g. expiry, manual removal)
  useEffect(() => {
    const sync = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setIsAdmin(authService.isAdmin());
      setIsSeller(authService.isSeller());
    };
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    await authService.login(credentials);
    setIsAuthenticated(true);
    setIsAdmin(authService.isAdmin());
    setIsSeller(authService.isSeller());
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authService.register(data);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsSeller(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAdmin, isSeller, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

