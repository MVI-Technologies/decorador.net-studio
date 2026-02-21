import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocketChat } from "@/hooks/useSocket";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Message } from "@/types/api";
import type { Role } from "@/types/api";
import { Send, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const roleLabel: Record<Role, string> = {
  CLIENT: "Cliente",
  PROFESSIONAL: "Profissional",
  ADMIN: "Suporte",
};

interface ChatPanelProps {
  projectId: string;
  className?: string;
  /** Quando true, ativa polling para mensagens em tempo real (ex.: painel aberto) */
  isActive?: boolean;
}

/** Extrai lista de mensagens da resposta GET /chat/:projectId/messages (aceita vários formatos) */
function normalizeChatMessages(res: unknown): Message[] {
  if (Array.isArray(res)) return res as Message[];
  const body = res as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return [];
  const inner = body.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray(body.data)) return body.data as Message[];
  if (Array.isArray(body.messages)) return body.messages as Message[];
  if (inner && typeof inner === "object") {
    const obj = inner as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Message[];
    if (Array.isArray(obj.messages)) return obj.messages as Message[];
  }
  return [];
}

function getSenderLabel(m: Message, currentUserId: string | undefined): string {
  const isMe = m.senderId === currentUserId;
  const sender = m.sender as { name?: string; role?: Role } | undefined;
  const name = sender?.name?.trim() || "Participante";
  const role = sender?.role ? roleLabel[sender.role] ?? sender.role : null;
  if (isMe) return role ? `Você (${role})` : "Você";
  return role ? `${name} — ${role}` : name;
}

export function ChatPanel({ projectId, className, isActive = true }: ChatPanelProps) {
  const { user } = useAuth();
  const showAdminNotice = user?.role === "CLIENT" || user?.role === "PROFESSIONAL";
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage, subscribeNewMessage } = useSocketChat(projectId, user?.id ?? null);

  const { data: messagesData, refetch } = useQuery({
    queryKey: ["chat", projectId],
    queryFn: async () => {
      const res = await api.get(`/chat/${projectId}/messages`, { params: { page: 1, limit: 100 } });
      return normalizeChatMessages(res.data);
    },
    enabled: !!projectId,
    refetchInterval: isActive ? 4000 : false,
  });

  const rawMessages: Message[] = Array.isArray(messagesData) ? messagesData : [];
  const messages = [...rawMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  useEffect(() => {
    if (!projectId || !user?.id) return;
    const unsub = subscribeNewMessage(() => {
      refetch();
    });
    return unsub;
  }, [projectId, user?.id, subscribeNewMessage, refetch]);

  useEffect(() => {
    if (!projectId || !user?.id) return;
    api.post(`/chat/${projectId}/read`).catch(() => {});
  }, [projectId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
    refetch();
  };

  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card", className)}>
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold text-foreground">Chat do projeto</h3>
        <p className="text-xs text-muted-foreground">Mensagens em tempo real</p>
        {showAdminNotice && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-muted/80 px-3 py-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            O suporte da plataforma tem acesso a este chat e pode ver e enviar mensagens quando necessário.
          </p>
        )}
      </div>
      <ScrollArea className="min-h-[280px] flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const senderLabel = getSenderLabel(m, user?.id);
              return (
                <div
                  key={m.id}
                  className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                >
                  <span className={cn("mb-0.5 text-xs font-medium", isMe ? "text-primary" : "text-muted-foreground")}>
                    {senderLabel}
                  </span>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    <p className="break-words">{m.content}</p>
                    {m.fileUrl && (
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs underline">
                        Anexo
                      </a>
                    )}
                    <p className={cn("mt-1 text-xs", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="flex gap-2 border-t border-border p-3">
        <Input
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="rounded-full"
        />
        <Button type="button" size="icon" className="rounded-full shrink-0 shadow-brand" onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
