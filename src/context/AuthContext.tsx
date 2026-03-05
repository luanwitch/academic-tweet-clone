import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { authService } from "@/services/authService";
import type { User, LoginCredentials, RegisterCredentials } from "@/types";

// ✅ 1 chave única no projeto inteiro
const TOKEN_KEY = "auth_token";

type AuthedUser = User & { token?: string | null };

interface AuthContextType {
  user: AuthedUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);

    // ✅ limpeza de legado (se em algum lugar antigo salvou diferente)
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");

    setToken(null);
    setUser(null);
  }, []);

  // Boot: se tem token, pega /users/me/
  useEffect(() => {
    const initAuth = async () => {
      try {
        const t = localStorage.getItem(TOKEN_KEY);
        if (!t) {
          setIsLoading(false);
          return;
        }

        setToken(t);

        const currentUser = await authService.getCurrentUser();
        setUser({ ...(currentUser as any), token: t });
      } catch (error) {
        console.error("Token inválido/expirado:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [clearAuth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result: any = await authService.login(credentials);

    // tenta pegar token do retorno, senão do storage (authService salva)
    const tokenFromResponse =
      result?.token || result?.key || result?.data?.token || result?.data?.key;

    const tokenFromStorage = localStorage.getItem(TOKEN_KEY);

    const t = tokenFromResponse || tokenFromStorage;

    if (!t) {
      throw new Error("Login OK, mas token não foi encontrado/salvo.");
    }

    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);

    const currentUser = await authService.getCurrentUser();
    setUser({ ...(currentUser as any), token: t });
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const result: any = await authService.register(credentials);

    // pode ou não vir token no register (depende do backend)
    const tokenFromResponse =
      result?.token || result?.key || result?.data?.token || result?.data?.key;

    const tokenFromStorage = localStorage.getItem(TOKEN_KEY);

    const t = tokenFromResponse || tokenFromStorage || null;

    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);

      const currentUser = await authService.getCurrentUser();
      setUser({ ...(currentUser as any), token: t });
    } else {
      // sem token no register: usuário vai precisar logar
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      if (!t) {
        clearAuth();
        return;
      }

      setToken(t);

      const currentUser = await authService.getCurrentUser();
      setUser({ ...(currentUser as any), token: t });
    } catch (error) {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token, // ✅ o que importa é token existir
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};