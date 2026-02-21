/**
 * useFirstAccess — detecta se o usuário CLIENT está fazendo o primeiro acesso
 * usando o campo `onboardingCompleted` do `clientProfile` vindo da API (/auth/me).
 *
 * Persiste `onboardingCompleted: true` via PATCH /clients/me/profile.
 *
 * localStorage é usado APENAS para auto-save do rascunho do wizard
 * (draft por userId), nunca para controlar o flag de onboarding.
 */

import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export interface OnboardingDraft {
  step?: number;
  roomType?: string;
  styles?: string[];
  budgetRange?: string;
  priority?: string;
  roomSize?: string;
  hasPets?: boolean;
  hasChildren?: boolean;
  deadline?: string;
}

function draftKey(userId: string) {
  return `onboarding_draft_${userId}`;
}

export function useFirstAccess() {
  const { user, clientProfile, refreshMe } = useAuth();
  const uid = user?.id ?? "";

  /**
   * true = primeiro acesso (onboarding ainda não foi concluído no banco).
   * Enquanto o perfil ainda está carregando (clientProfile === null) e o
   * usuário é CLIENT, retornamos `false` para não redirecionar prematuramente.
   */
  const isFirstAccess = useCallback((): boolean => {
    if (!uid || user?.role !== "CLIENT") return false;
    // clientProfile null pode significar "ainda carregando" ou "sem perfil ainda".
    // Só redirecionamos quando temos certeza que o field está falsy.
    if (clientProfile === null) return false;
    return !clientProfile.onboardingCompleted;
  }, [uid, user?.role, clientProfile]);

  /**
   * Persiste o flag no banco e atualiza o contexto de auth para refletir
   * imediatamente sem necessidade de relogin.
   */
  const markDone = useCallback(async () => {
    if (!uid) return;
    try {
      await api.patch("/clients/me/profile", { onboardingCompleted: true });
      // Sincroniza o AuthContext com o novo valor do banco
      await refreshMe();
    } catch {
      // Silencia erros aqui — o usuário já completou o fluxo visualmente
    }
    // Limpa o rascunho local
    localStorage.removeItem(draftKey(uid));
  }, [uid, refreshMe]);

  const saveProgress = useCallback((data: OnboardingDraft) => {
    if (!uid) return;
    localStorage.setItem(draftKey(uid), JSON.stringify(data));
  }, [uid]);

  const loadProgress = useCallback((): OnboardingDraft => {
    if (!uid) return {};
    try {
      const raw = localStorage.getItem(draftKey(uid));
      return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
    } catch {
      return {};
    }
  }, [uid]);

  const clearProgress = useCallback(() => {
    if (!uid) return;
    localStorage.removeItem(draftKey(uid));
  }, [uid]);

  return { isFirstAccess, markDone, saveProgress, loadProgress, clearProgress };
}
