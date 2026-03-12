import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicIdBadge } from "@/components/ui/PublicIdBadge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Project, PaginatedResponse } from "@/types/api";
import { projectStatusLabel } from "@/lib/projectStatus";
import { paymentStatusLabel } from "@/lib/projectStatus";
import { Briefcase } from "lucide-react";
import { useState } from "react";

const limit = 10;

function normalizeProjectsResponse(res: unknown): PaginatedResponse<Project> {
  const body = res as Record<string, unknown> | undefined;
  if (!body) return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
  const inner = body.data as Record<string, unknown> | unknown[] | undefined;
  const arr = Array.isArray(body.data)
    ? body.data
    : Array.isArray((inner as Record<string, unknown>)?.data)
      ? (inner as { data: unknown[] }).data
      : Array.isArray(body.projects)
        ? body.projects
        : Array.isArray(body)
          ? body
          : [];
  const meta = (body.meta ?? (inner as Record<string, unknown>)?.meta) as PaginatedResponse<Project>["meta"] | undefined;
  const defaultMeta = { total: arr.length, page: 1, limit, totalPages: 1 };
  return { data: arr as Project[], meta: meta ?? defaultMeta };
}

export default function ProjetosAdmin() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projects", page],
    queryFn: async () => {
      try {
        const res = await api.get(adminApi.projects, { params: { page, limit } });
        return normalizeProjectsResponse(res.data);
      } catch {
        return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
      }
    },
  });

  const projects = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };

  return (
    <div className="container min-w-0 max-w-full py-8 px-4 sm:px-6">
      <h1 className="text-display-md text-foreground">Projetos</h1>
      <p className="mt-2 text-muted-foreground">
        Projetos em desenvolvimento e status de pagamento.
      </p>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum projeto"
          description="Não há projetos listados."
          className="mt-10"
        />
      ) : (
        <>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Listagem</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto px-4 sm:px-6">
              <ul className="divide-y divide-border">
                {projects.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/app/projetos/${p.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Cliente: {(p.client as { name?: string })?.name ?? p.clientId ?? "—"} ·{" "}
                        Profissional: {(p.professionalProfile?.user as { name?: string })?.name ?? (p.professionalProfileId ? "Atribuído" : "—")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PublicIdBadge id={p.publicId} />
                        <Badge variant="secondary">
                          {projectStatusLabel[p.status] ?? p.status}
                        </Badge>
                        {p.payment ? (
                          <Badge variant="outline">
                            Pagamento: {paymentStatusLabel[p.payment.status] ?? p.payment.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pagamento: —</Badge>
                        )}
                        {p.payment?.amount != null && (
                          <span className="text-sm text-muted-foreground">
                            R$ {p.payment.amount.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/app/projetos/${p.id}`}
                      className="text-sm font-medium text-primary hover:underline shrink-0"
                    >
                      Ver detalhes
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {meta.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                      isActive={page === p}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(meta.totalPages, p + 1));
                    }}
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
