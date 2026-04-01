import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicIdBadge } from "@/components/ui/PublicIdBadge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { adminApi } from "@/lib/admin-api";
import type { User } from "@/types/api";
import type { PaginatedResponse } from "@/types/api";
import { User as UserIcon, Search } from "lucide-react";
import { useState, useMemo } from "react";

const limit = 10;

const roleLabels: Record<string, string> = {
  CLIENT: "Cliente",
  PROFESSIONAL: "Profissional",
  ADMIN: "Administrador",
};

function normalizeUsersResponse(res: unknown): PaginatedResponse<User> {
  const body = res as Record<string, unknown> | undefined;
  if (!body) return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
  const inner = body.data as Record<string, unknown> | unknown[] | undefined;
  const arr = Array.isArray(body.data)
    ? body.data
    : Array.isArray((inner as Record<string, unknown>)?.data)
      ? ((inner as Record<string, unknown>).data as unknown[])
      : Array.isArray(body.users)
        ? body.users
        : Array.isArray(body)
          ? body
          : [];
  const meta = (body.meta ?? (inner as Record<string, unknown> | undefined)?.meta) as PaginatedResponse<User>["meta"] | undefined;
  const defaultMeta = { total: arr.length, page: 1, limit, totalPages: 1 };
  return { data: arr as User[], meta: meta ?? defaultMeta };
}

function getIsActive(u: User & { active?: boolean }): boolean {
  return u.isActive ?? u.active ?? true;
}

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, searchName.trim() || undefined],
    queryFn: async () => {
      const params: Record<string, number | string> = { page, limit };
      if (searchName.trim()) params.name = searchName.trim();
      const res = await api.get(adminApi.users, { params });
      return normalizeUsersResponse(res.data);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: string) => {
      setTogglingId(userId);
      await api.patch(adminApi.userToggleActive(userId));
    },
    onSuccess: () => {
      setTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status atualizado!");
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(getApiErrorMessage(err));
    },
  });

  const rawUsers = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };
  const users = useMemo(() => {
    const term = searchName.trim().toLowerCase();
    if (!term) return rawUsers;
    return rawUsers.filter((u) => {
      const nameMatch = u.name?.toLowerCase().includes(term);
      const emailLocal = u.email?.split("@")[0]?.toLowerCase() ?? "";
      const emailMatch = emailLocal.includes(term);
      return nameMatch || emailMatch;
    });
  }, [rawUsers, searchName]);

  return (
    <div className="container min-w-0 max-w-full py-8 px-4 sm:px-6">
      <h1 className="text-display-md text-foreground">Usuários</h1>
      <p className="mt-2 text-muted-foreground">Listar e ativar/desativar usuários.</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-full"
          />
        </div>
      </div>

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
            <CardContent className="overflow-visible px-4 sm:px-6">
              <ul className="divide-y divide-border">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <PublicIdBadge id={u.publicId || u.clientProfile?.publicId || u.professionalProfile?.publicId} />
                        <Badge variant="secondary">{roleLabels[u.role] ?? u.role}</Badge>
                        {u.professionalProfile?.instagram && (
                          <span className="text-xs font-medium text-primary">
                            @{u.professionalProfile.instagram.replace('@', '')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Label htmlFor={`active-${u.id}`} className="text-sm text-muted-foreground whitespace-nowrap">
                        {getIsActive(u) ? "Ativo" : "Inativo"}
                      </Label>
                      <Switch
                        id={`active-${u.id}`}
                        checked={getIsActive(u)}
                        onCheckedChange={() => toggleMutation.mutate(u.id)}
                        disabled={togglingId === u.id}
                      />
                    </div>
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
