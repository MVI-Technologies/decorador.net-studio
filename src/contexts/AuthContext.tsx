import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearStoredToken, getStoredToken, setStoredToken, setOnUnauthorized, getApiErrorMessage } from "@/lib/api";
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

  const refreshMe = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setState((s) => ({ ...s, user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false }));
      return;
    }
    try {
      const { data } = await api.get<AuthMeResponse>("/auth/me");
      setState({
        user: data.user,
        clientProfile: data.clientProfile ?? null,
        professionalProfile: data.professionalProfile ?? null,
        loading: false,
        isAuthenticated: true,
      });
    } catch {
      clearStoredToken();
      setState((s) => ({ ...s, user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false }));
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
    if (getStoredToken()) {
      refreshMe();
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/signin", { email, password });
      setStoredToken(data.accessToken);
      setState({
        user: data.user,
        clientProfile: null,
        professionalProfile: null,
        loading: false,
        isAuthenticated: true,
      });
      await refreshMe();
      navigate("/app", { replace: true });
    },
    [navigate, refreshMe]
  );

  const signup = useCallback(
    async (data: { name: string; email: string; password: string; role: "CLIENT" | "PROFESSIONAL"; phone?: string }) => {
      const res = await api.post<AuthResponse>("/auth/signup", data);
      setStoredToken(res.data.accessToken);
      setState({
        user: res.data.user,
        clientProfile: null,
        professionalProfile: null,
        loading: false,
        isAuthenticated: true,
      });
      await refreshMe();
      navigate("/app", { replace: true });
    },
    [navigate, refreshMe]
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setState({ user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false });
    navigate("/", { replace: true });
  }, [navigate]);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { getApiErrorMessage };
