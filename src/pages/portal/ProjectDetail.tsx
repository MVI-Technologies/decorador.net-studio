import { Link, useParams, useNavigate } from "react-router-dom";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { projectStatusLabel } from "@/lib/projectStatus";
import type { Project, ProjectStatus } from "@/types/api";
import { ArrowLeft, Check, RefreshCw, Star, MessageSquare } from "lucide-react";
import { useState } from "react";

const REVISION_LIMIT = 3;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [revisionComment, setRevisionComment] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      const payload = res.data?.data ?? res.data ?? {};
      return (payload?.project ?? payload) as Project;
    },
    enabled: !!id,
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

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/professionals/me/projects/${id}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Projeto aceito!");
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
  const canAccept = isProfessional && status === "PROFESSIONAL_ASSIGNED";
  const canDeliver = isProfessional && (status === "IN_PROGRESS" || status === "REVISION_REQUESTED");
  const showChat = isAdmin || status === "IN_PROGRESS" || status === "REVISION_REQUESTED" || status === "DELIVERED" || status === "COMPLETED" || status === "PROFESSIONAL_ASSIGNED";

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 rounded-full -ml-2">
        <Link to="/app/projetos" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos projetos
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display-md text-foreground">{project.title}</h1>
          <Badge variant="secondary" className="mt-2">{projectStatusLabel[status] ?? status}</Badge>
        </div>
      </div>

      {isClient && (status === "BRIEFING_SUBMITTED" || status === "MATCHING") && (
        <div className="mt-6">
          <Button asChild className="rounded-full shadow-brand">
            <Link to={`/app/projetos/${id}/match`}>Ver match e atribuir profissional</Link>
          </Button>
        </div>
      )}

      {isClient && project.payment?.status === "PENDING" && (
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
            <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-2xl">
              <div className="flex-1 overflow-hidden pt-6">
                <ChatPanel projectId={id} className="h-full max-h-full border-0 rounded-none" isActive={chatOpen} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {canAccept && (
        <Card className="mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>Projeto atribuído a você</CardTitle>
            <CardDescription>Aceite para começar a trabalhar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="rounded-full shadow-brand"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Aceitar projeto
            </Button>
          </CardContent>
        </Card>
      )}

      {canDeliver && (
        <Card className="mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>Entregar projeto</CardTitle>
            <CardDescription>Envie o resultado para o cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="rounded-full shadow-brand"
              onClick={() => deliverMutation.mutate()}
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
            <CardTitle>Avaliar projeto</CardTitle>
            <CardDescription>Deixe sua avaliação para o decorador.</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {project.briefing && (
        <Card className="mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle>Briefing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Cômodo:</strong> {project.briefing.roomType ?? "—"}</p>
            <p><strong className="text-foreground">Metragem:</strong> {project.briefing.roomSize ?? "—"}</p>
            <p><strong className="text-foreground">Orçamento:</strong> {project.briefing.budget ?? "—"}</p>
            {project.briefing.description && <p><strong className="text-foreground">Descrição:</strong> {project.briefing.description}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
