import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocketChat } from "@/hooks/useSocket";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import type { Message } from "@/types/api";
import type { Role } from "@/types/api";
import { Send, Shield, Paperclip, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface UploadChatResult {
  url: string;
  path: string;
}

async function uploadChatFile(file: File): Promise<UploadChatResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<{ url?: string; path?: string; data?: { url?: string; path?: string } }>(
    "/storage/upload",
    form,
    { params: { folder: "chat" } }
  );
  const data = res.data?.data ?? res.data;
  const url = (data as { url?: string })?.url ?? res.data?.url;
  const path = (data as { path?: string })?.path ?? res.data?.path;
  if (!url || !path) throw new Error("Resposta do upload sem url ou path");
  return { url, path };
}

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

/** Link para anexo: usa signed URL quando há fileStoragePath (bucket privado), senão fileUrl */
function ChatAttachmentLink({
  fileUrl,
  fileStoragePath,
}: {
  fileUrl?: string;
  fileStoragePath?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (fileStoragePath) {
      setLoading(true);
      try {
        const res = await api.get<{ url?: string; data?: { url?: string } }>(
          "/storage/chat/signed-url",
          { params: { path: fileStoragePath } }
        );
        const url = res.data?.url ?? (res.data as { data?: { url?: string } })?.data?.url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        else toast.error("Não foi possível obter o link do anexo.");
      } catch {
        toast.error("Link expirado ou indisponível. Tente novamente.");
      } finally {
        setLoading(false);
      }
    } else if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-1 block text-left text-xs underline hover:no-underline disabled:opacity-70"
    >
      {loading ? "Abrindo…" : "Anexo"}
    </button>
  );
}

export function ChatPanel({ projectId, className, isActive = true }: ChatPanelProps) {
  const { user } = useAuth();
  const showAdminNotice = user?.role === "CLIENT" || user?.role === "PROFESSIONAL";
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
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

  const addFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo 10 MB.");
      return;
    }
    setAttachment(file);
  };

  const removeAttachment = () => setAttachment(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (!dropZoneRef.current?.contains(related)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) addFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFile(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !attachment) return;
    if (attachment) {
      setIsUploading(true);
      try {
        const { url, path } = await uploadChatFile(attachment);
        sendMessage(text || " ", url, path);
        setInput("");
        setAttachment(null);
        refetch();
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage(text);
      setInput("");
      refetch();
    }
  };

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "relative flex flex-col rounded-xl border border-border bg-card transition-colors",
        isDragging && "ring-2 ring-primary",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/80 backdrop-blur-sm"
          aria-hidden
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Upload className="h-7 w-7" />
          </div>
          <p className="text-center text-sm font-medium text-foreground">
            Solte o arquivo aqui para anexar
          </p>
          <p className="text-xs text-muted-foreground">Máximo 10 MB</p>
        </div>
      )}
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
                    {(m.fileUrl || m.fileStoragePath) && (
                      <ChatAttachmentLink fileUrl={m.fileUrl} fileStoragePath={m.fileStoragePath} />
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
      <div className="flex flex-col gap-2 border-t border-border p-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="*"
          onChange={handleFileInputChange}
          aria-label="Anexar arquivo"
        />
        {attachment && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate text-foreground" title={attachment.name}>
              {attachment.name}
            </span>
            <span className="text-xs text-muted-foreground">
              ({(attachment.size / 1024).toFixed(1)} KB)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full"
              onClick={removeAttachment}
              aria-label="Remover anexo"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Selecionar arquivo"
            title="Anexar arquivo (máx. 10 MB)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Digite sua mensagem ou arraste um arquivo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="rounded-full flex-1"
          />
          <Button
            type="button"
            size="icon"
            className="rounded-full shrink-0 shadow-brand"
            onClick={handleSend}
            disabled={(!input.trim() && !attachment) || isUploading}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Arraste um arquivo aqui ou use o ícone de clipe. Máximo 10 MB.
        </p>
      </div>
    </div>
  );
}
