import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearStoredToken, getStoredToken, setStoredToken, setBootstrapUser, getBootstrapUser, setOnUnauthorized, getApiErrorMessage } from "@/lib/api";
import type { AuthMeResponse, AuthResponse, Role, User, ClientProfile, ProfessionalProfile } from "@/types/api";

interface AuthState {
  user: User | null;
  clientProfile: ClientProfile | null;
  professionalProfile: ProfessionalProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: "CLIENT" | "PROFESSIONAL"; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

/** Normaliza user da API (camelCase ou snake_case) */
function normalizeUser(raw: Record<string, unknown>): User {
  const u = raw as Record<string, unknown>;
  return {
    id: String(u.id ?? ""),
    email: String(u.email ?? ""),
    name: String(u.name ?? ""),
    role: (u.role as Role) ?? "CLIENT",
    phone: (u.phone ?? u.phoneNumber ?? u.telefone ?? u.phone_number) as string | undefined,
    avatarUrl: (u.avatarUrl ?? u.avatar_url) as string | undefined,
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    clientProfile: null,
    professionalProfile: null,
    loading: true,
    isAuthenticated: false,
  });

  const refreshMe = useCallback(async (opts?: { clearTokenOnError?: boolean }) => {
    const clearOnError = opts?.clearTokenOnError ?? true;
    const token = getStoredToken();
    if (!token) {
      setState((s) => ({ ...s, user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false }));
      return;
    }
    try {
      const response = await api.get("/auth/me", { skipAuthRedirect: true });
      const payload = response.data?.data ?? response.data ?? {};
      const rawUser = payload?.user ?? (payload?.id ? payload : null);
      const user = rawUser ? normalizeUser(rawUser as Record<string, unknown>) : null;
      const clientProfile = payload?.clientProfile ?? null;
      const professionalProfile = payload?.professionalProfile ?? null;
      if (user) {
        setState({
          user,
          clientProfile: clientProfile ?? null,
          professionalProfile: professionalProfile ?? null,
          loading: false,
          isAuthenticated: true,
        });
      } else if (clearOnError) {
        clearStoredToken();
        setState((s) => ({ ...s, user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false }));
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    } catch (error) {
      if (clearOnError) {
        clearStoredToken();
        setState((s) => ({ ...s, user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false }));
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setState((s) => ({ ...s, user: null, clientProfile: null, professionalProfile: null, isAuthenticated: false }));
      navigate("/login", { replace: true });
    });
    return () => setOnUnauthorized(null);
  }, [navigate]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    // Usar user do bootstrap (sessionStorage) imediatamente — evita flash de redirect
    const bootstrap = getBootstrapUser();
    if (bootstrap) {
      setState((s) => ({
        ...s,
        user: bootstrap,
        loading: false,
        isAuthenticated: true,
      }));
    }
    // Buscar perfil completo em background
    refreshMe({ clearTokenOnError: false });
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post("/auth/signin", { email, password });
      const payload = response.data?.data ?? response.data;
      const { user, accessToken } = payload;
      if (!user || !accessToken) throw new Error("Resposta de login inválida");
      setStoredToken(accessToken);
      setBootstrapUser(user);
      setState({
        user,
        clientProfile: null,
        professionalProfile: null,
        loading: false,
        isAuthenticated: true,
      });
      await refreshMe({ clearTokenOnError: false });
    },
    [refreshMe]
  );

  const signup = useCallback(
    async (data: { name: string; email: string; password: string; role: "CLIENT" | "PROFESSIONAL"; phone?: string }) => {
      await api.post("/auth/signup", data);
      // Apenas cria a conta; não faz login. O usuário deve entrar em /login.
    },
    []
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setState({ user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false });
    navigate("/", { replace: true });
  }, [navigate]);

  const updateUser = useCallback((partial: Partial<User>) => {
    setState((s) =>
      s.user ? { ...s, user: { ...s.user, ...partial } } : s,
    );
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    refreshMe,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { getApiErrorMessage };
