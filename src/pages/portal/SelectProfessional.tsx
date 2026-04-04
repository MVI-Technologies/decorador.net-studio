import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Star,
  MapPin,
  Loader2,
  UserCheck,
  CreditCard,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type {
  Project,
  ChatProfessional,
  SelectProfessionalResponse,
} from "@/types/api";
import { useState } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `há ${mins || 1} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days !== 1 ? "s" : ""}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SelectProfessional() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<ChatProfessional | null>(null);

  // ── Buscar dados do projeto ─────────────────────────────────────────────
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      const payload = res.data?.data ?? res.data ?? {};
      return (payload?.project ?? payload) as Project;
    },
    enabled: !!id,
  });

  // ── Buscar profissionais com quem o cliente conversou ───────────────────
  // GET /projects/:id/chat-professionals
  // Retorna apenas profissionais que já trocaram mensagens com o cliente
  const {
    data: chatProfessionals = [],
    isLoading: loadingProfessionals,
  } = useQuery({
    queryKey: ["project-chat-professionals", id],
    queryFn: async (): Promise<ChatProfessional[]> => {
      const res = await api.get(`/projects/${id}/chat-professionals`);
      const payload = res.data?.data ?? res.data ?? [];
      return Array.isArray(payload) ? payload : [];
    },
    enabled: !!id && !!project,
  });

  // ── Mutation: selecionar profissional ──────────────────────────────────
  // POST /projects/:id/select-professional
  // Body: { professionalProfileId: string }
  // Response: { checkoutUrl, paymentPreferenceId, project }
  const selectMutation = useMutation({
    mutationFn: async (professionalProfileId: string) => {
      const res = await api.post<SelectProfessionalResponse>(
        `/projects/${id}/select-professional`,
        { professionalProfileId }
      );
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      // Invalidar cache do projeto para refletir novo status
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Profissional selecionado! Redirecionando para o pagamento...");
      setConfirmOpen(false);

      // Redirecionar imediatamente para o URL de checkout do Mercado Pago
      // A URL é externa (mercadopago.com.br), mas guardamos a rota interna
      // de fallback para quando o usuário voltar sem pagar.
      window.location.href = data.checkoutUrl;
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setConfirmOpen(false);
    },
  });

  const openConfirm = (prof: ChatProfessional) => {
    setSelected(prof);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!selected) return;
    selectMutation.mutate(selected.professionalProfileId);
  };

  // ── Guards ──────────────────────────────────────────────────────────────

  if (!id) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">ID não informado.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/app/projetos">Voltar</Link>
        </Button>
      </div>
    );
  }

  if (loadingProject) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Apenas o dono do projeto pode acessar
  if (project && project.clientId !== user?.id && user?.role !== "ADMIN") {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-md border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">
              Você não tem permissão para acessar este projeto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se já tiver profissional selecionado, mostrar estado adequado
  const alreadySelected: boolean =
    !!project?.selectedProfessionalId ||
    project?.status === "AWAITING_PAYMENT" ||
    project?.status === "IN_PROGRESS";

  const isLoading = loadingProject || loadingProfessionals;

  const selectedProfName =
    project?.selectedProfessional?.displayName ??
    project?.selectedProfessional?.user?.name ??
    "Profissional";

  return (
    <div className="container py-8">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 rounded-full">
        <Link to={`/app/projetos/${id}`} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao projeto
        </Link>
      </Button>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-display-md text-foreground">
            Escolher decorador
          </h1>
        </div>
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
          Estes são os decoradores com quem você já conversou neste projeto.
          Escolha um para prosseguir com o pagamento e iniciar o trabalho.
        </p>

        {project && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Projeto:</span>
            <span className="font-medium text-foreground">{project.title}</span>
            {project.price && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(project.price)}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Estado: profissional já selecionado ────────────────────── */}
      {alreadySelected && (
        <Card className="mb-8 max-w-2xl border-2 border-status-success/20 bg-status-success/10">
          <CardContent className="flex items-start gap-4 p-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {project?.status === "IN_PROGRESS"
                  ? `${selectedProfName} está trabalhando no seu projeto`
                  : `${selectedProfName} foi selecionado`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {project?.status === "AWAITING_PAYMENT"
                  ? "O pagamento ainda não foi confirmado. Use o botão abaixo para continuar."
                  : "O profissional já foi contratado para este projeto."}
              </p>
              {project?.status === "AWAITING_PAYMENT" &&
                project?.paymentCheckoutUrl && (
                  <Button
                    asChild
                    className="mt-4 rounded-full shadow-brand"
                    size="sm"
                  >
                    <a href={project.paymentCheckoutUrl}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Continuar pagamento
                    </a>
                  </Button>
                )}
              {project?.status !== "AWAITING_PAYMENT" && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 rounded-full"
                  size="sm"
                >
                  <Link to={`/app/projetos/${id}`}>
                    Ver projeto
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Lista de profissionais ─────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : chatProfessionals.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center max-w-2xl">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-foreground">
            Nenhum decorador encontrado
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            Você ainda não conversou com nenhum decorador neste projeto. Inicie
            uma conversa antes de selecionar.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link to={`/app/projetos/${id}/match`}>
              Encontrar decoradores
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {chatProfessionals.map((cp) => {
            const prof = cp.professionalProfile;
            const displayName =
              prof?.displayName ?? prof?.user?.name ?? "Decorador";
            const initials = displayName.slice(0, 2).toUpperCase();
            const isCurrentlySelected =
              project?.selectedProfessionalId === cp.professionalProfileId;

            return (
              <Card
                key={cp.professionalProfileId}
                className={`group relative overflow-hidden transition-all duration-200 hover:shadow-soft ${
                  isCurrentlySelected
                    ? "border-2 border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {isCurrentlySelected && (
                  <div className="absolute right-3 top-3 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs shadow-sm">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Selecionado
                    </Badge>
                  </div>
                )}

                <CardContent className="p-0">
                  {/* Portfolio cover */}
                  <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 relative">
                    {prof?.portfolioItems?.[0]?.imageUrl ? (
                      <img
                        src={prof.portfolioItems[0].imageUrl}
                        alt={prof.portfolioItems[0].title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl font-bold text-primary/20">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background shadow-sm">
                        <AvatarImage src={prof?.user?.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {displayName}
                        </p>
                        {(prof?.city || prof?.state) && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[prof.city, prof.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {prof?.averageRating != null && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Star className="h-3 w-3 fill-status-warning text-status-warning" />
                            <span>
                              {prof.averageRating.toFixed(1)}
                              {prof.reviewCount
                                ? ` (${prof.reviewCount})`
                                : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estilos */}
                    {prof?.styles?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {prof.styles.slice(0, 3).map((s) => (
                          <Badge
                            key={s.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {/* Bio */}
                    {prof?.bio && (
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {prof.bio}
                      </p>
                    )}

                    {/* Última mensagem */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>
                        {cp.messageCount} msg
                        {cp.messageCount !== 1 ? "s" : ""} ·{" "}
                        {relativeTime(cp.lastMessageAt)}
                      </span>
                    </div>

                    {/* Botão de seleção */}
                    <Button
                      className="mt-4 w-full rounded-full shadow-brand gap-2"
                      onClick={() => openConfirm(cp)}
                      disabled={
                        alreadySelected ||
                        selectMutation.isPending
                      }
                      variant={isCurrentlySelected ? "secondary" : "default"}
                    >
                      {isCurrentlySelected ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Selecionado
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Selecionar e pagar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Aviso de segurança ─────────────────────────────────────── */}
      {!alreadySelected && chatProfessionals.length > 0 && (
        <p className="mt-6 text-xs text-muted-foreground max-w-lg">
          🔒 Ao confirmar, você será redirecionado para o checkout seguro do
          Mercado Pago. O pagamento pode ser feito via PIX, débito ou crédito em
          até 12x. Seu dinheiro fica protegido até a conclusão do projeto.
        </p>
      )}

      {/* ── Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!selectMutation.isPending) {
            setConfirmOpen(open);
            if (!open) setSelected(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Confirmar seleção
            </DialogTitle>
            <DialogDescription>
              Você está prestes a contratar{" "}
              <strong className="text-foreground">
                {selected?.professionalProfile?.displayName ??
                  selected?.professionalProfile?.user?.name ??
                  "este decorador"}
              </strong>{" "}
              para o projeto{" "}
              <strong className="text-foreground">{project?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Card do profissional */}
          {selected && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage
                  src={selected.professionalProfile?.user?.avatarUrl}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {(
                    selected.professionalProfile?.displayName ??
                    selected.professionalProfile?.user?.name ??
                    "?"
                  )
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">
                  {selected.professionalProfile?.displayName ??
                    selected.professionalProfile?.user?.name}
                </p>
                {selected.professionalProfile?.styles?.length ? (
                  <p className="text-xs text-muted-foreground">
                    {selected.professionalProfile.styles
                      .slice(0, 2)
                      .map((s) => s.name)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              {project?.price && (
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-bold text-primary">
                    {formatCurrency(project.price)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Métodos de pagamento */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            <p className="text-xs font-medium text-foreground">
              Métodos de pagamento aceitos
            </p>
            <div className="flex flex-wrap gap-2">
              {["PIX", "Débito", "Crédito (até 12x)"].map((m) => (
                <Badge key={m} variant="secondary" className="text-xs">
                  {m}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você será redirecionado para o checkout seguro do{" "}
              <strong>Mercado Pago</strong>. Se sair sem pagar, poderá continuar
              o pagamento pelo projeto.
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row-reverse">
            <Button
              className="rounded-full shadow-brand"
              onClick={handleConfirm}
              disabled={selectMutation.isPending || !selected}
            >
              {selectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Confirmar e ir para pagamento
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setConfirmOpen(false);
                setSelected(null);
              }}
              disabled={selectMutation.isPending}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
