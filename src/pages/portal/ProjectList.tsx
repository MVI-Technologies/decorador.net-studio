import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Briefcase, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import type { Project, PaginatedResponse, Proposal } from "@/types/api";
import { projectStatusLabel } from "@/lib/projectStatus";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import axios from "axios";

/** Permite editar briefing quando briefing enviado ou em busca de profissional. */
const EDITABLE_STATUSES = ["BRIEFING_SUBMITTED", "MATCHING"];

/** Status até NEGOCIANDO em que o cliente pode excluir o projeto (desde que não haja proposta aceita). */
const DELETE_PROJECT_STATUSES = ["BRIEFING_SUBMITTED", "MATCHING", "NEGOCIANDO"];

const limit = 10;

export default function ProjectList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ projectId: string; briefingId: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async ({ briefingId }: { briefingId: string }) => {
      await api.delete(`/briefings/${briefingId}`, { skipAuthRedirect: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["professional-projects"] });
      toast.success("Projeto excluído.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      const msg =
        axios.isAxiosError(err) && err.response?.status === 400 && err.response?.data?.message
          ? String(err.response.data.message).trim()
          : getApiErrorMessage(err);
      const displayMsg =
        msg && /proposta\s+aceita|já tem proposta aceita/i.test(msg)
          ? "Não é possível excluir: este projeto já tem proposta aceita."
          : msg;
      toast.error(displayMsg);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: user?.role === "CLIENT" ? ["projects", page] : ["professional-projects", page],
    queryFn: async () => {
      if (user?.role === "CLIENT") {
        const res = await api.get<PaginatedResponse<Project>>("/projects", { params: { page, limit } });
        return res.data;
      }
      const res = await api.get<PaginatedResponse<Project>>("/professionals/me/projects", { params: { page, limit } });
      return res.data;
    },
    enabled: !!user,
  });

  const raw = data?.data;
  const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const projects = Array.isArray(arr) ? arr : [];
  const meta = data?.meta ?? raw?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };

  const projectIdsForProposals = useMemo(
    () =>
      user?.role === "CLIENT"
        ? projects.filter((p) => DELETE_PROJECT_STATUSES.includes(p.status)).map((p) => p.id)
        : [],
    [user?.role, projects]
  );

  const proposalsQueries = useQueries({
    queries: projectIdsForProposals.map((projectId) => ({
      queryKey: ["proposals", projectId] as const,
      queryFn: async (): Promise<Proposal[]> => {
        const res = await api.get(`/proposals/${projectId}`);
        const rawList = res.data?.data ?? res.data;
        return Array.isArray(rawList) ? (rawList as Proposal[]) : [];
      },
      enabled: true,
    })),
  });

  const hasAcceptedProposalByProjectId = useMemo(() => {
    const map: Record<string, boolean> = {};
    projectIdsForProposals.forEach((id, i) => {
      const list = proposalsQueries[i]?.data ?? [];
      map[id] = list.some((p) => p.status === "ACCEPTED");
    });
    return map;
  }, [projectIdsForProposals, proposalsQueries]);

  const canDeleteProject = (p: Project) =>
    user?.role === "CLIENT" &&
    DELETE_PROJECT_STATUSES.includes(p.status) &&
    !hasAcceptedProposalByProjectId[p.id];

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-display-md text-foreground">Projetos</h1>
        {user?.role === "CLIENT" && (
          <Button asChild className="rounded-full shadow-brand" size="lg">
            <Link to="/app/novo-briefing">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo briefing
            </Link>
          </Button>
        )}
      </div>
      <p className="mt-2 text-muted-foreground">
        {user?.role === "CLIENT" ? "Todos os seus projetos de decoração." : "Projetos atribuídos a você."}
      </p>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                <div className="mt-2 h-4 w-1/2 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum projeto"
          description={user?.role === "CLIENT" ? "Crie um briefing para começar." : "Quando um cliente atribuir um projeto, ele aparecerá aqui."}
        >
          {user?.role === "CLIENT" && (
            <Button asChild className="rounded-full shadow-brand">
              <Link to="/app/novo-briefing">Criar briefing</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const canEdit = user?.role === "CLIENT" && EDITABLE_STATUSES.includes(p.status);
              const briefingId = (p.briefing as { id?: string })?.id ?? p.id;
              return (
                <Card
                  key={p.id}
                  className={`overflow-hidden transition-shadow hover:shadow-soft ${
                    p.status === "CANCELLED" ? "border-muted bg-muted/30 opacity-90" : ""
                  }`}
                >
                  <Link to={`/app/projetos/${p.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground truncate flex-1">{p.title}</h3>
                        <Badge
                          variant={p.status === "CANCELLED" ? "outline" : "secondary"}
                          className={
                            p.status === "CANCELLED" ? "shrink-0 border-muted-foreground/50 text-muted-foreground" : "shrink-0"
                          }
                        >
                          {projectStatusLabel[p.status] ?? p.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {p.professionalProfile ? (p.professionalProfile.displayName ?? p.professionalProfile.user?.name ?? "Decorador") : "Sem profissional ainda"}
                      </p>
                    </CardContent>
                  </Link>
                  {(canEdit || canDeleteProject(p)) && (
                    <div className="flex gap-2 px-6 pb-6" onClick={(e) => e.preventDefault()}>
                      {canEdit && (
                        <Button asChild variant="outline" size="sm" className="rounded-full flex-1">
                          <Link to={`/app/projetos/${p.id}/editar-briefing`} className="flex items-center justify-center gap-2">
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                        </Button>
                      )}
                      {canDeleteProject(p) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget({ projectId: p.id, briefingId })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir projeto
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          {meta.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage(p); }}
                      isActive={page === p}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(meta.totalPages, p + 1)); }}
                    className={page >= meta.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto e o briefing serão removidos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate({ briefingId: deleteTarget.briefingId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo…" : "Excluir projeto"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
