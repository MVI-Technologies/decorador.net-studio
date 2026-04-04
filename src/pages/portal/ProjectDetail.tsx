import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { projectStatusLabel } from "@/lib/projectStatus";
import type { Project, ProjectStatus, Review } from "@/types/api";
import {
  ArrowLeft,
  Check,
  RefreshCw,
  Star,
  MessageSquare,
  FileText,
  CreditCard,
  UserCheck,
  ExternalLink,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

const REVISION_LIMIT = 3;

/* ================================================================== */
/* Briefing Summary Card                                                */
/* ================================================================== */

function BriefingSummaryCard({ project, isClient }: { project: Project; isClient: boolean }) {
  const title = project.title ?? "";
  const isCompleto = title.startsWith("Projeto Completo");
  const isConsultoria = title.startsWith("Consultoria");
  const isLegacy = !isCompleto && !isConsultoria;

  const bulletMode = isCompleto ? "completo" : isConsultoria ? "consultoria" : null;

  const reqString = (project as Project & { requirements?: string }).requirements ?? "";
  const bullets = reqString
    ? reqString.split("; ").filter(Boolean)
    : [];

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary shrink-0" />
        <h3 className="font-semibold text-foreground text-base">Resumo do Briefing</h3>
        {isLegacy && (
          <span className="ml-2 rounded-full border border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground">
            Briefing legado
          </span>
        )}
        {isCompleto && (
          <span className="ml-2 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs text-primary font-medium">
            Projeto Completo 🏠
          </span>
        )}
        {isConsultoria && (
          <span className="ml-2 rounded-full border border-status-info/30 bg-status-info/10 px-2 py-0.5 text-xs text-status-info font-medium">
            Consultoria 💬
          </span>
        )}
      </div>

      {bullets.length > 0 ? (
        <ul className="space-y-1.5">
          {bullets.map((b, i) => {
            const [key, ...rest] = b.split(": ");
            const val = rest.join(": ");
            return (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">•</span>
                <span>
                  {val ? (
                    <><span className="font-medium text-foreground">{key}:</span>{" "}<span className="text-muted-foreground">{val}</span></>
                  ) : (
                    <span className="text-muted-foreground">{key}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {isLegacy ? "Briefing criado no sistema antigo." : "Nenhum detalhe registrado."}
        </p>
      )}

      {isClient && (
        <div className="mt-4 flex gap-2">
          {isLegacy ? (
            <>
              <Link
                to="/comecar"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                Refazer briefing →
              </Link>
            </>
          ) : (
            <Link
              to={`/comecar/${bulletMode}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Editar briefing
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Awaiting Payment Banner                                              */
/* Exibido quando status === "AWAITING_PAYMENT"                         */
/* ================================================================== */

function AwaitingPaymentBanner({
  project,
}: {
  project: Project;
}) {
  const professionalName =
    project.selectedProfessional?.displayName ??
    project.selectedProfessional?.user?.name ??
    "Decorador selecionado";

  const hasCheckoutUrl = !!project.paymentCheckoutUrl;

  return (
    <Card className="mt-6 max-w-2xl border-2 border-status-warning/20 bg-status-warning/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-warning/20">
            <Clock className="h-5 w-5 text-status-warning" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Pagamento pendente
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Você selecionou{" "}
              <strong className="text-foreground">{professionalName}</strong>.
              Para que o projeto comece, complete o pagamento via Mercado Pago.
            </p>

            {project.price && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-status-warning/20 bg-white px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-bold text-foreground">
                  {project.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {hasCheckoutUrl ? (
                <Button
                  asChild
                  className="rounded-full shadow-brand gap-2"
                  size="sm"
                >
                  <a href={project.paymentCheckoutUrl!} target="_self">
                    <CreditCard className="h-4 w-4" />
                    Ir para pagamento
                  </a>
                </Button>
              ) : (
                <Button
                  asChild
                  className="rounded-full shadow-brand gap-2"
                  size="sm"
                >
                  <Link to={`/app/projetos/${project.id}/selecionar-profissional`}>
                    <CreditCard className="h-4 w-4" />
                    Ir para pagamento
                  </Link>
                </Button>
              )}

              {/* Métodos aceitos */}
              <div className="flex items-center gap-1.5">
                {["PIX", "Débito", "Crédito"].map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              O projeto só iniciará após a confirmação automática do pagamento.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/* Professional Selected Banner                                         */
/* Exibido para o profissional quando status === "AWAITING_PAYMENT"    */
/* ================================================================== */

function ProfessionalAwaitingPaymentBanner() {
  return (
    <Card className="mt-8 max-w-xl border-2 border-status-warning/20 bg-status-warning/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCheck className="h-5 w-5 text-status-warning" />
          Você foi selecionado para este projeto
        </CardTitle>
        <CardDescription>
          O cliente selecionou você e está finalizando o pagamento via Mercado
          Pago. Assim que o pagamento for confirmado, o projeto iniciará
          automaticamente.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

/* ================================================================== */
/* Main Component                                                       */
/* ================================================================== */

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [revisionComment, setRevisionComment] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if ((location.state as { openChat?: boolean })?.openChat) {
      setChatOpen(true);
    }
  }, [location.state]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      const payload = res.data?.data ?? res.data ?? {};
      return (payload?.project ?? payload) as Project;
    },
    enabled: !!id,
    // Polling quando pagamento aguardado — para capturar webhook de confirmação
    refetchInterval: (query) => {
      const d = query.state.data as Project | undefined;
      if (d?.status === "AWAITING_PAYMENT") return 8_000;
      return false;
    },
  });

  const { data: myReview } = useQuery({
    queryKey: ["review", "project", id],
    queryFn: async (): Promise<Review | null> => {
      try {
        const res = await api.get<Review>(`/reviews/project/${id}`);
        const data = res.data?.data ?? res.data;
        return (data ?? null) as Review | null;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
    enabled: !!id && user?.role === "CLIENT" && project?.status === "COMPLETED",
  });

  const assignMutation = useMutation({
    mutationFn: async (_: { professionalProfileId: string; price: number }) => {
      await api.post(`/projects/${id}/assign`, _);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Profissional atribuído!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deliverMutation = useMutation({
    mutationFn: async (message?: string) => {
      await api.post(`/professionals/me/projects/${id}/deliver`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Entrega enviada!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/projects/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Projeto aprovado!");
      navigate(`/app/projetos/${id}/pronto`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const revisionMutation = useMutation({
    mutationFn: async (comment?: string) => {
      await api.post(`/projects/${id}/revision`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Revisão solicitada!");
      setRevisionOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/reviews/${id}`, { rating: reviewRating, comment: reviewComment || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["review", "project", id] });
      toast.success("Avaliação enviada!");
      setReviewOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

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

  if (isLoading || !project) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-6 h-32 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  const status = project.status as ProjectStatus;
  const isClient = user?.role === "CLIENT";
  const isProfessional = user?.role === "PROFESSIONAL";
  const isAdmin = user?.role === "ADMIN";
  const revisionCount = project.revisionCount ?? 0;
  const canRequestRevision = isClient && status === "DELIVERED" && revisionCount < REVISION_LIMIT;
  const canApprove = isClient && status === "DELIVERED";
  const canReview = isClient && status === "COMPLETED";
  const canDeliver =
    isProfessional && (status === "IN_PROGRESS" || status === "REVISION_REQUESTED");

  // AWAITING_PAYMENT: profissional selecionado mas pagamento ainda pendente
  const isAwaitingPayment = status === "AWAITING_PAYMENT";

  // Exibe o banner de "profissional selecionado + aguadando pagamento" para
  // o profissional que de fato foi selecionado (selectedProfessionalId)
  const isProfessionalSelectedAndWaiting =
    isProfessional &&
    isAwaitingPayment &&
    project.selectedProfessionalId === user?.id; // ou via professionalProfile

  // Compatibilidade com fluxo legado (PROFESSIONAL_ASSIGNED + payment PENDING)
  const isProfessionalWaitingPaymentLegacy =
    isProfessional &&
    status === "PROFESSIONAL_ASSIGNED" &&
    project.payment?.status === "PENDING";

  const showChat =
    isAdmin ||
    status === "MATCHING" ||
    status === "NEGOCIANDO" ||
    status === "PROFESSIONAL_ASSIGNED" ||
    status === "AWAITING_PAYMENT" ||
    status === "IN_PROGRESS" ||
    status === "REVISION_REQUESTED" ||
    status === "DELIVERED" ||
    status === "APPROVED" ||
    status === "COMPLETED" ||
    status === "CANCELLED";

  // Badge color
  const statusBadgeClass =
    status === "AWAITING_PAYMENT"
      ? "border-status-warning/30 bg-status-warning/10 text-status-warning"
      : status === "IN_PROGRESS"
      ? "border-status-success/30 bg-status-success/10 text-status-success"
      : undefined;

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 rounded-full -ml-2">
        <Link to="/app/projetos" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos projetos
        </Link>
      </Button>

      {status === "CANCELLED" && (
        <div className="mb-6 rounded-lg border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Este projeto foi cancelado. O histórico de conversas e propostas permanece disponível para consulta.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display-md text-foreground">{project.title}</h1>
          <Badge
            variant={status === "CANCELLED" ? "outline" : "secondary"}
            className={
              status === "CANCELLED"
                ? "mt-2 border-muted-foreground/50 text-muted-foreground"
                : statusBadgeClass
                ? `mt-2 border ${statusBadgeClass}`
                : "mt-2"
            }
          >
            {projectStatusLabel[status] ?? status}
          </Badge>
        </div>

        {/* Botão "Selecionar decorador" — aparece em NEGOCIANDO para o cliente */}
        {isClient &&
          (status === "NEGOCIANDO" || status === "MATCHING") && (
            <Button asChild className="rounded-full shadow-brand gap-2">
              <Link to={`/app/projetos/${id}/selecionar-profissional`}>
                <UserCheck className="h-4 w-4" />
                Selecionar decorador
              </Link>
            </Button>
          )}
      </div>

      {/* AWAITING_PAYMENT: banner para o cliente continuar o pagamento */}
      {isClient && isAwaitingPayment && (
        <AwaitingPaymentBanner project={project} />
      )}

      {/* AWAITING_PAYMENT: banner para o profissional aguardar */}
      {(isProfessionalSelectedAndWaiting || isProfessionalWaitingPaymentLegacy) && (
        <ProfessionalAwaitingPaymentBanner />
      )}

      {/* Briefing Summary Card */}
      <BriefingSummaryCard project={project} isClient={isClient} />

      {/* Fluxo legacy: briefing_submitted / matching → escolher decorador */}
      {isClient && (status === "BRIEFING_SUBMITTED" || status === "MATCHING") && (
        <div className="mt-6">
          <Button asChild className="rounded-full shadow-brand">
            <Link to={`/app/projetos/${id}/match`}>Escolher decorador e solicitar proposta</Link>
          </Button>
        </div>
      )}

      {/* Fluxo legacy: pagamento PIX manual */}
      {isClient && project.payment?.status === "PENDING" && status !== "AWAITING_PAYMENT" && (
        <Card className="mt-6 max-w-xl border-primary/30 bg-primary/5">
          <CardContent className="flex flex-row items-center justify-between gap-4 p-6">
            <div>
              <CardTitle className="text-lg">Pagamento pendente</CardTitle>
              <CardDescription className="mt-1">
                Realize o pagamento PIX para que o decorador possa iniciar o projeto.
              </CardDescription>
            </div>
            <Button asChild size="lg" className="shrink-0 rounded-full shadow-brand">
              <Link to={`/app/projetos/${id}/pagamento`}>Pagar com PIX</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {showChat && (
        <div className="mt-8">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Abrir chat do projeto
          </Button>
          <Sheet open={chatOpen} onOpenChange={setChatOpen}>
            <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-2xl" aria-describedby={undefined}>
              <SheetTitle className="sr-only">Chat do projeto</SheetTitle>
              <div className="flex-1 overflow-hidden pt-6">
                <ChatPanel projectId={id} project={project} className="h-full max-h-full border-0 rounded-none" isActive={chatOpen} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Profissional: projeto atribuído legado (PROFESSIONAL_ASSIGNED, sem payment PENDING) */}
      {isProfessional && status === "PROFESSIONAL_ASSIGNED" && !project.payment && (
        <Card className="mt-8 max-w-xl border-muted">
          <CardHeader>
            <CardTitle>Projeto atribuído a você</CardTitle>
            <CardDescription>
              Aguarde a confirmação do pagamento pelo administrador antes de começar.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {canDeliver && (
        <Card className="mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>Projeto atribuído a você</CardTitle>
            <CardDescription>
              Pagamento confirmado. Pode começar o projeto. Quando estiver pronto, clique em Entregar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="rounded-full shadow-brand"
              onClick={() => deliverMutation.mutate(undefined)}
              disabled={deliverMutation.isPending}
            >
              Entregar
            </Button>
          </CardContent>
        </Card>
      )}

      {canApprove && (
        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            className="rounded-full shadow-brand"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Aprovar entrega
          </Button>
          {canRequestRevision && (
            <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Solicitar revisão ({revisionCount}/{REVISION_LIMIT})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar revisão</DialogTitle>
                  <DialogDesc>Descreva o que precisa ser ajustado.</DialogDesc>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Comentário (opcional)</Label>
                    <Textarea
                      placeholder="O que o decorador deve ajustar?"
                      value={revisionComment}
                      onChange={(e) => setRevisionComment(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    className="rounded-full shadow-brand w-full"
                    onClick={() => revisionMutation.mutate(revisionComment)}
                    disabled={revisionMutation.isPending}
                  >
                    Enviar solicitação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {canReview && (
        <Card className="mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>{myReview ? "Sua avaliação" : "Avaliar projeto"}</CardTitle>
            <CardDescription>
              {myReview
                ? "Você já avaliou este projeto."
                : "Deixe sua avaliação para o decorador."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myReview ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{myReview.rating}/5</span>
                </div>
                {myReview.comment && (
                  <p className="text-muted-foreground">{myReview.comment}</p>
                )}
              </div>
            ) : (
              <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full shadow-brand">
                    <Star className="mr-2 h-4 w-4" />
                    Avaliar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Avaliar entrega</DialogTitle>
                    <DialogDesc>Nota de 1 a 5 e comentário opcional.</DialogDesc>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Nota (1-5)</Label>
                      <div className="mt-2 flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewRating(n)}
                            className={`rounded-full h-10 w-10 font-semibold transition-colors ${
                              reviewRating === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Comentário (opcional)</Label>
                      <Textarea
                        placeholder="Como foi a experiência?"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      className="rounded-full shadow-brand w-full"
                      onClick={() => reviewMutation.mutate()}
                      disabled={reviewMutation.isPending}
                    >
                      Enviar avaliação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
