import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import type { User } from "@/types/api";
import type { PaginatedResponse } from "@/types/api";
import { User as UserIcon } from "lucide-react";
import { useState } from "react";

const limit = 10;

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<User>>("/admin/users", { params: { page, limit } });
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/admin/users/${userId}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status atualizado!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Usuários</h1>
      <p className="mt-2 text-muted-foreground">Listar e ativar/desativar usuários.</p>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserIcon}
          title="Nenhum usuário"
          description="Não há usuários cadastrados."
          className="mt-10"
        />
      ) : (
        <>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Listagem</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-row items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <Badge variant="secondary" className="mt-1">{u.role}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => toggleMutation.mutate(u.id)}
                      disabled={toggleMutation.isPending}
                    >
                      Alternar ativo
                    </Button>
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
