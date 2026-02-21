import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { Project, PaginatedResponse, Proposal } from "@/types/api";
import { DollarSign, MessageSquare, Package, Clock, FileText } from "lucide-react";

const limit = 50;

const proposalStatusLabel: Record<Proposal["status"], string> = {
  PENDING: "Aguardando resposta",
  ACCEPTED: "Aceita ✓",
  DECLINED: "Recusada",
  NEGOTIATING: "Em negociação",
};

function ProposalBlock({ proposal }: { proposal: Proposal }) {
  const status = String(proposal.status).toUpperCase() as Proposal["status"];
  const statusColor = {
    PENDING: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    ACCEPTED: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    DECLINED: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    NEGOTIATING: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  }[status] ?? "bg-muted/50 border-border";

  return (
    <div className={`rounded-xl border-2 p-3 text-sm ${statusColor}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-foreground">
          R$ {proposal.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <Badge variant="outline" className="text-xs">
          {proposalStatusLabel[status] ?? status}
        </Badge>
      </div>
      <div className="mt-2 space-y-1 text-muted-foreground">
        {proposal.packageType && (
          <p className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span>{proposal.packageType}</span>
          </p>
        )}
        {(proposal.estimatedDays ?? proposal.deadlineDays) != null && (
          <p className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{proposal.estimatedDays ?? proposal.deadlineDays} dias</span>
          </p>
        )}
        {(proposal.notes ?? proposal.message) && (
          <p className="flex items-start gap-2">
            <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="whitespace-pre-wrap break-words">{proposal.notes ?? proposal.message}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function Propostas() {
  const { user, professionalProfile } = useAuth();

  const { data: projectsData, isLoading: loadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: user?.role === "CLIENT" ? ["projects-propostas"] : ["professional-projects-propostas"],
    queryFn: async () => {
      if (user?.role === "CLIENT") {
        const res = await api.get<PaginatedResponse<Project>>("/projects", { params: { page: 1, limit } });
        return res.data;
      }
      const res = await api.get<PaginatedResponse<Project>>("/professionals/me/projects", { params: { page: 1, limit } });
      return res.data;
    },
    enabled: !!user && (user.role === "CLIENT" || user.role === "PROFESSIONAL"),
    refetchInterval: user?.role === "CLIENT" ? 10_000 : false,
  });

  const raw = projectsData?.data;
  const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const projects = Array.isArray(arr) ? arr : [];

  const proposalsQueries = useQueries({
    queries: projects.map((p) => ({
      queryKey: ["proposals", p.id] as const,
      queryFn: async (): Promise<Proposal[]> => {
        const res = await api.get(`/proposals/${p.id}`);
        const rawList = res.data?.data ?? res.data?.proposals ?? res.data;
        return Array.isArray(rawList) ? (rawList as Proposal[]) : [];
      },
      enabled: projects.length > 0,
    })),
  });

  const projectsWithProposals: { project: Project; proposals: Proposal[] }[] = [];
  projects.forEach((project, i) => {
    const fromProject = Array.isArray(project.proposals) ? project.proposals : [];
    const fromQuery = proposalsQueries[i]?.data ?? [];
    const list = fromProject.length > 0 ? fromProject : fromQuery;

    if (user?.role === "PROFESSIONAL" && professionalProfile?.id) {
      const myProposals = list.filter((p) => p.professionalProfileId === professionalProfile.id);
      if (myProposals.length > 0) projectsWithProposals.push({ project, proposals: myProposals });
    } else if (user?.role === "CLIENT") {
      const pending = list.filter((p) => String(p.status).toUpperCase() === "PENDING");
      if (pending.length > 0) {
        projectsWithProposals.push({ project, proposals: pending });
      }
    }
  });

  const isLoading = loadingProjects || (projects.length > 0 && proposalsQueries.some((q) => q.isLoading));

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Propostas</h1>
      <p className="mt-2 text-muted-foreground">
        {user?.role === "CLIENT"
          ? "Propostas recebidas nos seus projetos. Abra o chat para aceitar ou recusar."
          : "Propostas que você enviou. Acompanhe o status e a conversa no chat do projeto."}
      </p>

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : projectsWithProposals.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhuma proposta"
          description={
            user?.role === "CLIENT"
              ? "Quando decoradores enviarem propostas para seus projetos, elas aparecerão aqui. Abra o chat do projeto para aceitar ou recusar."
              : "Envie propostas pelo chat dos projetos em negociação. Elas aparecerão aqui."
          }
          className="mt-10"
        >
          {user?.role === "CLIENT" && (
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => refetchProjects()}
            >
              Atualizar lista
            </Button>
          )}
        </EmptyState>
      ) : (
        <ul className="mt-8 space-y-4">
          {projectsWithProposals.map(({ project, proposals }) => (
            <li key={project.id}>
              <Card className="overflow-hidden transition-shadow hover:shadow-soft">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {proposals.length} proposta{proposals.length !== 1 ? "s" : ""} pendente
                        {proposals.length !== 1 ? "s" : ""} de aceite
                      </p>
                    </div>
                    <Link
                      to={`/app/projetos/${project.id}`}
                      state={{ openChat: true }}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Abrir chat para aceitar ou recusar
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {proposals.map((proposal) => (
                      <ProposalBlock key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
