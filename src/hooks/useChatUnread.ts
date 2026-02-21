import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { ChatUnreadSummary } from "@/types/api";

const QUERY_KEY = ["chat-unread-summary"] as const;

export function useChatUnread() {
  const { user } = useAuth();
  const isClientOrPro = user?.role === "CLIENT" || user?.role === "PROFESSIONAL";

  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ChatUnreadSummary> => {
      try {
        const res = await api.get<ChatUnreadSummary>("/chat/unread-summary");
        const body = res.data?.data ?? res.data;
        if (body && typeof body === "object" && "chatsWithUnread" in body) {
          return {
            chatsWithUnread: Number((body as ChatUnreadSummary).chatsWithUnread) || 0,
            byProject: (body as ChatUnreadSummary).byProject,
          };
        }
      } catch {
        // Endpoint pode não existir ainda; não quebra a UI
      }
      return { chatsWithUnread: 0 };
    },
    enabled: !!user && isClientOrPro,
    staleTime: 60_000,
    refetchInterval: 90_000,
    retry: false,
  });

  return {
    chatsWithUnread: data?.chatsWithUnread ?? 0,
    byProject: data?.byProject ?? ({} as Record<string, number>),
  };
}

export { QUERY_KEY as CHAT_UNREAD_QUERY_KEY };
