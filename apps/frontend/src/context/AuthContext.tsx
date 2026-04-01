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
  username: string | null;
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
  const [username, setUsername] = useState<string | null>(() => authService.getUsername());

  useEffect(() => {
    const sync = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setIsAdmin(authService.isAdmin());
      setIsSeller(authService.isSeller());
      setUsername(authService.getUsername());
    };
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    await authService.login(credentials);
    setIsAuthenticated(true);
    setIsAdmin(authService.isAdmin());
    setIsSeller(authService.isSeller());
    setUsername(authService.getUsername());
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authService.register(data);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsSeller(false);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAdmin, isSeller, username, login, register, logout }}
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

