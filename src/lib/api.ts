import axios, { type AxiosError } from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "decorador_access_token";
const USER_KEY = "decorador_user_bootstrap";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function setBootstrapUser(user: { id: string; email: string; name: string; role: string }): void {
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function getBootstrapUser(): { id: string; email: string; name: string; role: string } | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id && u?.email ? u : null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // FormData: não enviar Content-Type para o browser definir multipart/form-data com boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: () => void): void {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => {
    // O backend usa TransformInterceptor global que embrulha todas as respostas em:
    // { statusCode, message, data: <payload real>, timestamp }
    // Desembrulhamos aqui para que todo o frontend acesse res.data diretamente.
    if (
      res.data &&
      typeof res.data === "object" &&
      "data" in res.data &&
      "statusCode" in res.data &&
      "timestamp" in res.data
    ) {
      res.data = res.data.data;
    }
    return res;
  },
  (err: AxiosError<{ message?: string; statusCode?: number }>) => {
    if (err.response?.status === 401) {
      const skipAuthRedirect = err.config?.skipAuthRedirect;
      if (!skipAuthRedirect) {
        clearStoredToken();
        onUnauthorized?.();
      }
    }
    return Promise.reject(err);
  }
);

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return String(err.response.data.message);
  }
  if (err instanceof Error) return err.message;
  return "Ocorreu um erro. Tente novamente.";
}
