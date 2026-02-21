import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ArrowLeft, MessageSquare, MapPin } from "lucide-react";
import type { Project, ProfessionalProfile } from "@/types/api";
import { useState } from "react";

export default function Match() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedProf, setSelectedProf] = useState<ProfessionalProfile | null>(null);
  const [message, setMessage] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      const payload = res.data?.data ?? res.data ?? {};
      return (payload?.project ?? payload) as Project;
    },
    enabled: !!id,
  });

  const { data: matchList = [] } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}/match`);
      const payload = res.data?.data ?? res.data ?? {};
      const arr = Array.isArray(payload) ? payload : (payload?.data ?? payload ?? []);
      return (Array.isArray(arr) ? arr : []).filter(
        (p): p is ProfessionalProfile => p && typeof p === "object" && !!p.id
      );
    },
    enabled:
      !!id &&
      (project?.status === "BRIEFING_SUBMITTED" || project?.status === "MATCHING"),
  });

  const requestMutation = useMutation({
    mutationFn: async (payload: { professionalProfileId: string; message?: string }) => {
      await api.post(`/projects/${id}/request-proposal`, payload);
    },
    onSuccess: () => {
      toast.success("Conversa iniciada! O decorador foi notificado e já tem acesso ao seu briefing.");
      setConfirmOpen(false);
      setSelectedProf(null);
      setMessage("");
      navigate(`/app/projetos/${id}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleRequest = () => {
    if (!selectedProf) return;
    requestMutation.mutate({
      professionalProfileId: selectedProf.id,
      message: message.trim() || undefined,
    });
  };

  const openConfirm = (prof: ProfessionalProfile) => {
    setSelectedProf(prof);
    setMessage("");
    setConfirmOpen(true);
  };

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

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 rounded-full -ml-2">
        <Link
          to={matchList.length === 0 ? `/app/projetos/${id}/editar-briefing` : `/app/projetos/${id}`}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {matchList.length === 0 ? "Editar briefing" : "Voltar ao projeto"}
        </Link>
      </Button>

      <h1 className="text-display-md text-foreground">Encontre seu decorador</h1>
      <p className="mt-2 text-muted-foreground">
        Profissionais compatíveis com seu briefing. Solicite uma proposta e converse antes de contratar.
      </p>

      {matchList.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <p className="text-muted-foreground">
            Nenhum profissional compatível no momento. Tente ajustar o briefing.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to={`/app/projetos/${id}/editar-briefing`}>Editar briefing</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matchList.map((prof) => (
            <Card key={prof.id} className="overflow-hidden transition-shadow hover:shadow-soft">
              <CardContent className="p-0">
                {/* Portfolio cover */}
                <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                  {prof.portfolioItems?.[0]?.imageUrl ? (
                    <img
                      src={prof.portfolioItems[0].imageUrl}
                      alt={prof.portfolioItems[0].title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Sem imagem
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={prof.user?.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(prof.displayName ?? prof.user?.name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">
                        {prof.displayName ?? prof.user?.name ?? "Decorador"}
                      </p>
                      {(prof.city || prof.state) && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {[prof.city, prof.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {(prof.averageRating != null || (prof.reviewCount ?? 0) > 0) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {prof.averageRating?.toFixed(1)} ({prof.reviewCount ?? 0})
                        </div>
                      )}
                    </div>
                  </div>

                  {prof.styles?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {prof.styles.slice(0, 3).map((s) => (
                        <Badge key={s.id} variant="secondary" className="text-xs">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {prof.bio && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{prof.bio}</p>
                  )}

                  <Button
                    className="mt-4 w-full rounded-full shadow-brand gap-2"
                    onClick={() => openConfirm(prof)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Solicitar proposta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setSelectedProf(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar conversa com decorador</DialogTitle>
            <DialogDescription>
              Você vai iniciar uma conversa com{" "}
              <strong className="text-foreground">
                {selectedProf?.displayName ?? selectedProf?.user?.name ?? "este decorador"}
              </strong>
              . Ele receberá o briefing completo e poderá te enviar uma proposta com preço e prazo.
            </DialogDescription>
          </DialogHeader>

          {selectedProf && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={selectedProf.user?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {(selectedProf.displayName ?? selectedProf.user?.name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">
                  {selectedProf.displayName ?? selectedProf.user?.name}
                </p>
                {selectedProf.styles?.length ? (
                  <p className="text-xs text-muted-foreground">
                    {selectedProf.styles.slice(0, 2).map(s => s.name).join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="initial-message">
              Mensagem inicial{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="initial-message"
              placeholder="Ex.: Tenho urgência no projeto, meu apartamento fica em SP e preciso de acabamentos sustentáveis..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              O briefing completo já será enviado automaticamente. Use este campo apenas para informações extras.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              className="rounded-full shadow-brand"
              onClick={handleRequest}
              disabled={requestMutation.isPending || !selectedProf}
            >
              {requestMutation.isPending ? "Iniciando..." : "Iniciar conversa"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => { setConfirmOpen(false); setSelectedProf(null); }}
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
