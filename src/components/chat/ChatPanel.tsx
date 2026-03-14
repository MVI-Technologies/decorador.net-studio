import { type ReactNode, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSocketChat } from "@/hooks/useSocket";
import { CHAT_UNREAD_QUERY_KEY } from "@/hooks/useChatUnread";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Message, NewMessagePayload, Project, Proposal, PixInfoResponse, Role } from "@/types/api";
import {
  Send,
  Shield,
  Paperclip,
  Upload,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  X,
  DollarSign,
  Clock,
  Package,
  FileText,
  LayoutList,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ProposalForm } from "./ProposalForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Constantes ─────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Tipos ──────────────────────────────────────────────

interface UploadChatResult {
  url: string;
  path: string;
}

interface ChatPanelProps {
  projectId: string;
  project?: Project;
  className?: string;
  /** Quando true, ativa polling a cada 4s (ex.: painel aberto em Sheet) */
  isActive?: boolean;
}

// ─── Upload de arquivo ───────────────────────────────────

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

// ─── roleLabel ────────────────────────────────────────────

const roleLabel: Record<Role, string> = {
  CLIENT: "Cliente",
  PROFESSIONAL: "Profissional",
  ADMIN: "Suporte",
};

// ─── Helpers ─────────────────────────────────────────────

function normalizeChatMessages(res: unknown): Message[] {
  if (Array.isArray(res)) return res as Message[];
  const body = res as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return [];
  if (Array.isArray(body.data)) return body.data as Message[];
  if (Array.isArray(body.messages)) return body.messages as Message[];
  const inner = body.data as Record<string, unknown> | undefined;
  if (inner && typeof inner === "object") {
    if (Array.isArray((inner as Record<string, unknown>).data))
      return (inner as Record<string, unknown>).data as Message[];
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

/** Detecta mensagens de sistema (__SYSTEM__) ou proposta (__PROPOSAL__) */
function parseMessageContent(content: string) {
  if (content.startsWith("__SYSTEM__\n")) {
    return { type: "system" as const, body: content.replace("__SYSTEM__\n", "") };
  }
  if (content.startsWith("__PROPOSAL__:")) {
    try {
      const json = JSON.parse(content.replace("__PROPOSAL__:", ""));
      return { type: "proposal-message" as const, data: json };
    } catch {
      return { type: "text" as const, body: content };
    }
  }
  return { type: "text" as const, body: content };
}

/** Mensagem parece ser texto de proposta (ex.: "**Proposta:** R$ 8.000") */
function isProposalLikeMessage(content: string): boolean {
  const t = content.trim();
  return /^(\*\*)?Proposta:\s*/i.test(t) || t.startsWith("__PROPOSAL__");
}

/** Renderiza texto com **...** em negrito (sem mostrar os asteriscos) */
function renderMessageBody(content: string): ReactNode {
  const parts = content.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return content;
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {p}
      </strong>
    ) : (
      p
    )
  );
}

// ─── ChatAttachmentLink ───────────────────────────────────

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

// ─── BriefingSummaryCard ─────────────────────────────────

function BriefingSummaryCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(true);
  const b = project.briefing as unknown as Record<string, unknown> | undefined;

  const items = [
    b?.roomType && { label: "Ambiente", value: String(b.roomType) },
    b?.roomSize && { label: "Metragem", value: String(b.roomSize) },
    b?.budget && { label: "Orçamento", value: `R$${Number(b.budget).toLocaleString("pt-BR")}` },
    b?.stylePreferences &&
      Array.isArray(b.stylePreferences) &&
      b.stylePreferences.length && {
        label: "Estilos",
        value: (b.stylePreferences as string[]).join(", "),
      },
    b?.requirements && { label: "Requisitos", value: String(b.requirements) },
    b?.description && { label: "Descrição", value: String(b.description) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="border-b border-border bg-muted/40">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <span className="text-sm font-semibold text-foreground">📋 Resumo do projeto</span>
          <span className="ml-2 text-xs text-muted-foreground">{project.title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 pb-3 text-xs sm:grid-cols-3">
          {items.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <span className="font-medium text-foreground">{label}: </span>
              <span className="text-muted-foreground line-clamp-1">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BriefingModal (briefing completo, sem truncar) ────────

function BriefingModal({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const b = project.briefing as unknown as Record<string, unknown> | undefined;
  const items = [
    b?.roomType && { label: "Ambiente", value: String(b.roomType) },
    b?.roomSize && { label: "Metragem", value: String(b.roomSize) },
    b?.budget && { label: "Orçamento", value: `R$${Number(b.budget).toLocaleString("pt-BR")}` },
    b?.stylePreferences &&
      Array.isArray(b.stylePreferences) &&
      b.stylePreferences.length && {
        label: "Estilos",
        value: (b.stylePreferences as string[]).join(", "),
      },
    b?.requirements && { label: "Requisitos", value: String(b.requirements) },
    b?.description && { label: "Descrição", value: String(b.description) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" />
            Briefing do projeto — {project.title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-3 -mr-3">
          <div className="space-y-4 pb-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma informação de briefing disponível.</p>
            ) : (
              items.map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{value}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── ProposalCard ─────────────────────────────────────────

function ProposalCard({
  proposal,
  isClient,
  onAccept,
  onDecline,
}: {
  proposal: Proposal;
  isClient: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const isPending = proposal.status === "PENDING";
  const isAccepted = proposal.status === "ACCEPTED";
  const isDeclined = proposal.status === "DECLINED";

  const statusColor = {
    PENDING: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    ACCEPTED: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    DECLINED: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    NEGOTIATING: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  }[proposal.status];

  return (
    <div className={cn("my-2 rounded-2xl border-2 p-4 shadow-sm", statusColor)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary shrink-0" />
          <span className="font-bold text-foreground text-lg">
            R${proposal.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            isPending && "border-amber-400 text-amber-700",
            isAccepted && "border-emerald-400 text-emerald-700",
            isDeclined && "border-red-400 text-red-700"
          )}
        >
          {isPending
            ? "Aguardando resposta"
            : isAccepted
            ? "Aceita ✓"
            : isDeclined
            ? "Recusada"
            : "Em negociação"}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm">
        {proposal.packageType && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong className="text-foreground">Pacote:</strong> {proposal.packageType}
            </span>
          </p>
        )}
        {(proposal.estimatedDays ?? proposal.deadlineDays) != null && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong className="text-foreground">Prazo:</strong>{" "}
              {proposal.estimatedDays ?? proposal.deadlineDays} dias
            </span>
          </p>
        )}
        {(proposal.notes ?? proposal.message) && (
          <p className="flex items-start gap-2 text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{proposal.notes ?? proposal.message}</span>
          </p>
        )}
      </div>

      {isClient && isPending && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="flex-1 rounded-full shadow-brand gap-1.5"
            onClick={() => onAccept(proposal.id)}
          >
            <Check className="h-4 w-4" /> Aceitar proposta
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5 text-destructive hover:text-destructive"
            onClick={() => onDecline(proposal.id)}
          >
            <X className="h-4 w-4" /> Recusar
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── ChatPanel ───────────────────────────────────────────

export function ChatPanel({ projectId, project, className, isActive = true }: ChatPanelProps) {
  const { user, professionalProfile } = useAuth();
  const queryClient = useQueryClient();
  const showAdminNotice = user?.role === "CLIENT" || user?.role === "PROFESSIONAL";
  const isClient = user?.role === "CLIENT";
  const isProfessional = user?.role === "PROFESSIONAL";
  const isLinkedProfessional =
    isProfessional && project?.status === "NEGOCIANDO" && project?.professionalProfileId === professionalProfile?.id;

  // State
  const [input, setInput] = useState("");
  const [proposalFormOpen, setProposalFormOpen] = useState(false);
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const { connected: socketConnected, sendMessage, subscribeNewMessage } = useSocketChat(projectId, user?.id ?? null);

  // ── Mensagens (carregamento inicial via HTTP; atualizações em tempo real via WebSocket) ─────

  const queryKeyChat = ["chat", projectId] as const;
  const { data: messagesData, refetch } = useQuery({
    queryKey: queryKeyChat,
    queryFn: async () => {
      const res = await api.get(`/chat/${projectId}/messages`, { params: { page: 1, limit: 100 } });
      return normalizeChatMessages(res.data);
    },
    enabled: !!projectId,
    refetchInterval: isActive && !socketConnected ? 10_000 : false,
  });

  const rawMessages: Message[] = Array.isArray(messagesData) ? messagesData : [];
  const messages = [...rawMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // ── Propostas ──────────────────────────────────────────

  const { data: proposalsData, refetch: refetchProposals } = useQuery<Proposal[]>({
    queryKey: ["proposals", projectId],
    queryFn: async () => {
      const res = await api.get(`/proposals/${projectId}`);
      const raw = res.data?.data ?? res.data?.proposals ?? res.data;
      return Array.isArray(raw) ? (raw as Proposal[]) : [];
    },
    enabled: !!projectId,
    refetchInterval: isActive && isClient ? 8_000 : false,
  });

  const proposalsFromApi = Array.isArray(proposalsData) ? proposalsData : [];
  const proposals: Proposal[] =
    Array.isArray(project?.proposals) ? project.proposals : proposalsFromApi;

  const hasPending = proposals.some(
    (p) => String(p.status).toUpperCase() === "PENDING"
  );
  const pendingProposal = proposals.find(
    (p) => String(p.status).toUpperCase() === "PENDING"
  );
  const hasActiveProposal = proposals.some(
    (p) =>
      String(p.status).toUpperCase() === "PENDING" ||
      String(p.status).toUpperCase() === "ACCEPTED"
  );
  const showMatchingStatus = project?.status === "MATCHING" && !hasActiveProposal;

  /** Proposta enviada pelo profissional (a mais recente), para ele ver os dados que enviou também no chat */
  const myProposalAsProfessional =
    isProfessional && professionalProfile?.id
      ? [...proposals]
          .filter((p) => p.professionalProfileId === professionalProfile.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;
  const showMyProposalToProfessional = !pendingProposal && !!myProposalAsProfessional;

  // ── PIX info (para modal após aceitar proposta) ─────────
  const { data: pixInfo, isLoading: pixInfoLoading } = useQuery<PixInfoResponse>({
    queryKey: ["payments-pix-info", projectId],
    queryFn: async () => {
      const res = await api.get<PixInfoResponse>(`/payments/project/${projectId}/pix-info`);
      return res.data;
    },
    enabled: pixModalOpen && !!projectId && isClient,
  });

  // ── Mutations propostas ────────────────────────────────

  const acceptMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/respond`, { action: "accept" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["chat", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["professional-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-chats"] });
      queryClient.invalidateQueries({ queryKey: ["professional-projects-chats"] });
      if (isClient) {
        setPixModalOpen(true);
      } else {
        toast.success("Proposta aceita!");
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const declineMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/respond`, { action: "decline" });
    },
    onSuccess: () => {
      toast.success("Proposta recusada. Você pode continuar negociando ou escolher outro decorador.");
      queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["chat", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["professional-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-chats"] });
      queryClient.invalidateQueries({ queryKey: ["professional-projects-chats"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  // ── Effects: atualização em tempo real via WebSocket ─────

  useEffect(() => {
    if (!projectId || !user?.id) return;
    const unsub = subscribeNewMessage((payload: NewMessagePayload) => {
      if (payload.projectId !== projectId) return;
      const newMsg: Message = {
        id: payload.id,
        projectId: payload.projectId,
        senderId: payload.senderId,
        content: payload.content,
        createdAt: payload.createdAt,
        ...(payload.fileUrl != null && { fileUrl: payload.fileUrl }),
        ...(payload.fileStoragePath != null && { fileStoragePath: payload.fileStoragePath }),
        ...(payload.sender != null && { sender: payload.sender as Message["sender"] }),
      };
      queryClient.setQueryData<Message[]>(queryKeyChat, (old) => {
        const list = Array.isArray(old) ? old : [];
        if (list.some((m) => m.id === payload.id)) return list;
        return [...list, newMsg].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      if (isProposalLikeMessage(payload.content)) {
        queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      }
      if (payload.senderId !== user?.id) {
        queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_QUERY_KEY });
      }
    });
    return () => { unsub?.(); };
  }, [projectId, user?.id, subscribeNewMessage, queryClient]);

  useEffect(() => {
    if (!projectId || !user?.id) return;
    api.post(`/chat/${projectId}/read`).then(() => {
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_QUERY_KEY });
    }).catch(() => {});
  }, [projectId, user?.id, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── File upload ────────────────────────────────────────

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

  // ── Send ───────────────────────────────────────────────

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
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage(text);
      setInput("");
    }
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-colors",
        isDragging && "ring-2 ring-primary",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
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

      {/* Briefing Summary (pinned, colapsável) */}
      {project && <BriefingSummaryCard project={project} />}

      {/* Chat Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">Chat do projeto</h3>
          <p className="text-xs text-muted-foreground">Mensagens em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          {project && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 shrink-0"
              onClick={() => setBriefingModalOpen(true)}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Ver briefing completo
            </Button>
          )}
          {isLinkedProfessional && !pendingProposal && (
            <Button
              size="sm"
              className="rounded-full shadow-brand gap-1.5 shrink-0"
              onClick={() => setProposalFormOpen(true)}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Enviar proposta
            </Button>
          )}
          {showAdminNotice && (
            <p className="hidden sm:flex items-center gap-1.5 rounded-lg bg-muted/80 px-3 py-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              O suporte tem acesso a este chat.
            </p>
          )}
        </div>
      </div>

      {/* Educational Banner - Funcionalidade 2 */}
      <div className="flex items-center gap-3 border-b border-border bg-yellow-50/80 px-4 py-3 dark:bg-yellow-950/20">
        <Shield className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
        <div className="text-sm text-yellow-800 dark:text-yellow-400">
          <p className="font-semibold">Proteja-se contra fraudes</p>
          <p>Para sua segurança, evite compartilhar contatos externos. Todas as conversas devem ocorrer dentro da plataforma.</p>
        </div>
      </div>

      {/* Awaiting proposal banner */}
      {showMatchingStatus && (
        <div className="flex items-center gap-3 border-b border-border bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
          <Clock className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {isClient
              ? "Aguardando proposta do decorador. Ele já tem acesso ao seu briefing."
              : "O cliente está aguardando sua proposta. Clique em \"Enviar proposta\" quando estiver pronto."}
          </p>
        </div>
      )}

      {/* Proposal card (pending) — cliente vê Aceitar/Recusar */}
      {pendingProposal && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Proposta em aberto
          </p>
          <ProposalCard
            proposal={pendingProposal}
            isClient={isClient ?? false}
            onAccept={(id) => acceptMutation.mutate(id)}
            onDecline={(id) => declineMutation.mutate(id)}
          />
        </div>
      )}

      {/* Proposta enviada pelo profissional (quando não há pendente) — ele vê os dados que enviou */}
      {showMyProposalToProfessional && myProposalAsProfessional && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sua proposta
          </p>
          <ProposalCard
            proposal={myProposalAsProfessional}
            isClient={false}
            onAccept={() => {}}
            onDecline={() => {}}
          />
        </div>
      )}

      {/* Modal PIX após aceitar proposta (cliente) */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-primary/20 p-0 overflow-hidden">
          <DialogHeader className="gradient-brand px-6 py-4 text-white">
            <DialogTitle className="text-lg text-white">
              Pagamento PIX
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 pt-2">
            {pixInfoLoading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-10 w-48 rounded bg-muted animate-pulse" />
                <div className="h-52 w-52 rounded-xl bg-muted animate-pulse" />
              </div>
            ) : pixInfo ? (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Realize o PIX para o admin da plataforma para iniciar o projeto.
                </p>
                <div className="mt-4 rounded-xl bg-muted/50 px-4 py-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Valor</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    R$ {pixInfo.amount.toFixed(2).replace(".", ",")}
                  </p>
                  {pixInfo.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{pixInfo.description}</p>
                  )}
                </div>
                {pixInfo.pixPayload ? (
                  <>
                    <Label className="mb-2 mt-4 block text-center text-sm">Escaneie o QR code no app do seu banco</Label>
                    <div className="flex justify-center rounded-xl bg-white p-4">
                      <QRCodeSVG value={pixInfo.pixPayload} size={200} level="M" />
                    </div>
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">PIX copia e cola</Label>
                      <div className="mt-1 flex gap-2">
                        <Input readOnly value={pixInfo.pixPayload} className="font-mono text-xs" />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="shrink-0 rounded-full"
                          onClick={() => {
                            if (pixInfo.pixPayload) {
                              navigator.clipboard.writeText(pixInfo.pixPayload);
                              setPixCopied(true);
                              toast.success("PIX copia e cola copiado!");
                              setTimeout(() => setPixCopied(false), 2000);
                            }
                          }}
                        >
                          {pixCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Label className="mb-2 mt-4 block text-sm">Chave PIX</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={pixInfo.pixKey} className="font-mono text-sm" />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="shrink-0 rounded-full"
                        onClick={() => {
                          if (pixInfo.pixKey) {
                            navigator.clipboard.writeText(pixInfo.pixKey);
                            setPixCopied(true);
                            toast.success("Chave PIX copiada!");
                            setTimeout(() => setPixCopied(false), 2000);
                          }
                        }}
                      >
                        {pixCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Tipo: <strong>{pixInfo.pixKeyType}</strong>. Transfira o valor para esta chave.
                    </p>
                  </>
                )}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Após o pagamento, o admin confirmará o recebimento e o projeto seguirá para o decorador.
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full rounded-full"
                  onClick={() => setPixModalOpen(false)}
                >
                  Fechar
                </Button>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar os dados do PIX. Acesse a página de pagamento do projeto.
                </p>
                <Button className="mt-4 rounded-full" onClick={() => setPixModalOpen(false)}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages */}
      <ScrollArea className="min-h-[280px] flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Inicie a conversa!
            </p>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const senderLabel = getSenderLabel(m, user?.id);
              const parsed = parseMessageContent(m.content);

              // Mensagem de sistema
              if (parsed.type === "system") {
                return (
                  <div
                    key={m.id}
                    className="my-2 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground whitespace-pre-line border border-border"
                  >
                    {renderMessageBody(parsed.body)}
                  </div>
                );
              }

              // Mensagem de proposta inline (card principal fica acima)
              if (parsed.type === "proposal-message" || isProposalLikeMessage(m.content)) {
                return (
                  <div
                    key={m.id}
                    className="my-1 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-muted-foreground"
                  >
                    📨 Proposta enviada — ver card acima para detalhes e ações.
                  </div>
                );
              }

              // Mensagem normal (** em negrito, sem asteriscos)
              return (
                <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <span
                    className={cn(
                      "mb-0.5 text-xs font-medium",
                      isMe ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {senderLabel}
                  </span>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    <p className="break-words">{renderMessageBody(m.content)}</p>
                    {(m.fileUrl || m.fileStoragePath) && (
                      <ChatAttachmentLink fileUrl={m.fileUrl} fileStoragePath={m.fileStoragePath} />
                    )}
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        isMe ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
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

      {/* Input area */}
      <div className="flex flex-col gap-2 border-t border-border p-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="*"
          onChange={handleFileInputChange}
          aria-label="Anexar arquivo"
        />

        {/* Attachment preview */}
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

        {/* Message row */}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
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

      {/* ProposalForm modal (só para profissional) */}
      {isProfessional && (
        <ProposalForm
          projectId={projectId}
          open={proposalFormOpen}
          onOpenChange={setProposalFormOpen}
        />
      )}

      {/* Modal com briefing completo do projeto */}
      {project && (
        <BriefingModal
          project={project}
          open={briefingModalOpen}
          onOpenChange={setBriefingModalOpen}
        />
      )}
    </div>
  );
}
