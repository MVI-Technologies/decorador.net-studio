import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converte avatarUrl relativa em absoluta; se já for http/https, retorna igual */
export function toAbsoluteAvatarUrl(src: string | undefined | null): string | undefined {
  if (!src || typeof src !== "string") return undefined;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const appUrl = import.meta.env.VITE_APP_URL;
  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
  const base = appUrl ?? new URL(apiBase).origin;
  const origin = base.endsWith("/") ? base.slice(0, -1) : base;
  return src.startsWith("/") ? `${origin}${src}` : `${origin}/${src}`;
}

/** Formata telefone BR enquanto digita: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits[2] === "9" && digits.length >= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}
