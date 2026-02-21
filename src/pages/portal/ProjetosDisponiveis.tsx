import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { projectStatusLabel } from "@/lib/projectStatus";
import type { Project, PaginatedResponse } from "@/types/api";
import { Briefcase, MessageSquare } from "lucide-react";

function getClientName(project: Project): string {
  const client = project.client as { name?: string } | undefined;
  return client?.name ?? "Cliente";
}

export default function ProjetosDisponiveis() {
  const { user } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["professional-available-projects"],
    queryFn: async (): Promise<Project[]> => {
      try {
        const res = await api.get<PaginatedResponse<Project> | { data: Project[] }>(
          "/professionals/me/available-projects",
          { params: { status: "MATCHING" } }
        );
        const body = res.data as PaginatedResponse<Project> | { data: Project[] } | undefined;
        if (!body) return [];
        const arr = Array.isArray((body as { data?: unknown }).data)
          ? (body as { data: Project[] }).data
          : Array.isArray(body)
            ? (body as Project[])
            : [];
        return arr.filter((p) => p.status === "MATCHING");
      } catch {
        return [];
      }
    },
    enabled: user?.role === "PROFESSIONAL",
  });

  const list: Project[] = Array.isArray(projects) ? projects : [];

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Projetos em busca de profissional</h1>
      <p className="mt-2 text-muted-foreground">
        Projetos em que o cliente está procurando decorador. Abra o chat para conversar e enviar sua proposta.
      </p>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum projeto disponível"
          description="Não há projetos em busca de profissional no momento. Os clientes aparecem aqui quando publicam um briefing e estão procurando decorador."
          className="mt-10"
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-soft">
              <CardContent className="p-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate flex-1">{p.title}</h3>
                    <Badge variant="secondary" className="shrink-0">
                      {projectStatusLabel[p.status] ?? p.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cliente: {getClientName(p)}
                  </p>
                  <Button asChild className="rounded-full w-full mt-2" size="sm">
                    <Link to={`/app/projetos/${p.id}`} state={{ openChat: true }} className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Abrir chat e conversar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
