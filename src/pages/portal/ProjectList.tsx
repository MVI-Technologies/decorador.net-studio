import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Briefcase, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Project, PaginatedResponse } from "@/types/api";
import { projectStatusLabel } from "@/lib/projectStatus";
import { useState } from "react";

const limit = 10;

export default function ProjectList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

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

  const projects = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };

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
            {projects.map((p) => (
              <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-soft">
                <Link to={`/app/projetos/${p.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground truncate flex-1">{p.title}</h3>
                      <Badge variant="secondary" className="shrink-0">{projectStatusLabel(p.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {p.professionalProfile ? (p.professionalProfile.displayName ?? p.professionalProfile.user?.name ?? "Decorador") : "Sem profissional ainda"}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
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
    </div>
  );
}
