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
    console.log('[AuthContext] refreshMe called, token exists:', !!token);
    if (!token) {
      setState((s) => ({ ...s, user: null, clientProfile: null, professionalProfile: null, loading: false, isAuthenticated: false }));
      return;
    }
    try {
      console.log('[AuthContext] Fetching /auth/me...');
      const response = await api.get("/auth/me");
      console.log('[AuthContext] /auth/me response:', response.data);
      
      // Backend wraps response in { statusCode, message, data: { user, clientProfile, professionalProfile } }
      const { user, clientProfile, professionalProfile } = response.data.data || response.data;
      
      console.log('[AuthContext] /auth/me success:', { user });
      setState({
        user,
        clientProfile: clientProfile ?? null,
        professionalProfile: professionalProfile ?? null,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('[AuthContext] /auth/me failed:', error);
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
      console.log('[AuthContext] Starting login...');
      const response = await api.post("/auth/signin", { email, password });
      console.log('[AuthContext] Login response:', response.data);
      
      // Backend wraps response in { statusCode, message, data: { user, accessToken } }
      const { user, accessToken } = response.data.data;
      
      console.log('[AuthContext] Extracted:', { user, hasToken: !!accessToken });
      setStoredToken(accessToken);
      console.log('[AuthContext] Token stored in localStorage');
      setState({
        user,
        clientProfile: null,
        professionalProfile: null,
        loading: false,
        isAuthenticated: true,
      });
      console.log('[AuthContext] Calling refreshMe...');
      await refreshMe();
      console.log('[AuthContext] Navigating to /app');
      navigate("/app", { replace: true });
    },
    [navigate, refreshMe]
  );

  const signup = useCallback(
    async (data: { name: string; email: string; password: string; role: "CLIENT" | "PROFESSIONAL"; phone?: string }) => {
      const response = await api.post("/auth/signup", data);
      
      // Backend wraps response in { statusCode, message, data: { user, accessToken } }
      const { user, accessToken } = response.data.data;
      
      setStoredToken(accessToken);
      setState({
        user,
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
