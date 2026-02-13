import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocketChat } from "@/hooks/useSocket";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Message } from "@/types/api";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  projectId: string;
  className?: string;
}

export function ChatPanel({ projectId, className }: ChatPanelProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sendMessage, subscribeNewMessage } = useSocketChat(projectId, user?.id ?? null);

  const { data: messagesData, refetch } = useQuery({
    queryKey: ["chat", projectId],
    queryFn: async () => {
      const res = await api.get<{ data: Message[] }>(`/chat/${projectId}/messages`, { params: { limit: 100 } });
      return res.data.data ?? [];
    },
    enabled: !!projectId,
  });

  const messages = messagesData ?? [];

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeNewMessage(() => {
      refetch();
    });
    return unsub;
  }, [projectId, subscribeNewMessage, refetch]);

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
      </div>
      <ScrollArea className="h-[320px] flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
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
