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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, ArrowLeft } from "lucide-react";
import type { Project, ProfessionalProfile } from "@/types/api";
import { useState } from "react";

export default function Match() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedProf, setSelectedProf] = useState<ProfessionalProfile | null>(null);
  const [price, setPrice] = useState("319");

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get<Project>(`/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: matchList = [] } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const res = await api.get<{ data?: ProfessionalProfile[] } | ProfessionalProfile[]>(`/projects/${id}/match`);
      const body = res.data as { data?: ProfessionalProfile[] } | ProfessionalProfile[];
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
    enabled: !!id && (project?.status === "BRIEFING_SUBMITTED" || project?.status === "MATCHING"),
  });

  const assignMutation = useMutation({
    mutationFn: async (payload: { professionalProfileId: string; price: number }) => {
      await api.post(`/projects/${id}/assign`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Profissional atribuído! Realize o pagamento PIX.");
      setAssignOpen(false);
      setSelectedProf(null);
      navigate(`/app/projetos/${id}/pagamento`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleAssign = () => {
    if (!selectedProf) return;
    const num = parseFloat(price.replace(",", "."));
    if (isNaN(num) || num < 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    assignMutation.mutate({ professionalProfileId: selectedProf.id, price: num });
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
        <Link to={`/app/projetos/${id}`} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao projeto
        </Link>
      </Button>

      <h1 className="text-display-md text-foreground">Escolha um decorador</h1>
      <p className="mt-2 text-muted-foreground">
        Profissionais compatíveis com seu briefing. Atribua um e defina o valor do projeto.
      </p>

      {matchList.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <p className="text-muted-foreground">Nenhum profissional compatível no momento. Tente ajustar o briefing.</p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to={`/app/projetos/${id}`}>Voltar ao projeto</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matchList.map((prof) => (
            <Card key={prof.id} className="overflow-hidden transition-shadow hover:shadow-soft">
              <CardContent className="p-0">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {prof.portfolioItems?.[0]?.imageUrl ? (
                    <img
                      src={prof.portfolioItems[0].imageUrl}
                      alt={prof.portfolioItems[0].title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">Sem imagem</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={prof.user?.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(prof.displayName ?? prof.user?.name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">
                        {prof.displayName ?? prof.user?.name ?? "Decorador"}
                      </p>
                      {(prof.averageRating != null || (prof.reviewCount ?? 0) > 0) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                  <Button
                        className="mt-4 w-full rounded-full shadow-brand"
                        onClick={() => { setSelectedProf(prof); setPrice("319"); setAssignOpen(true); }}
                      >
                        Atribuir
                      </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setSelectedProf(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir valor do projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProf && (
              <p className="text-sm text-muted-foreground">
                Atribuir a <strong className="text-foreground">{selectedProf.displayName ?? selectedProf.user?.name ?? "Decorador"}</strong>. Valor em R$ será colocado em escrow até a aprovação da entrega.
              </p>
            )}
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="text"
                placeholder="319"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              className="w-full rounded-full shadow-brand"
              onClick={handleAssign}
              disabled={assignMutation.isPending || !selectedProf}
            >
              Confirmar e atribuir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
