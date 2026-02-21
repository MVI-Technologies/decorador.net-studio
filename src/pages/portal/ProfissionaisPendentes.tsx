import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { adminApi } from "@/lib/admin-api";
import type { ProfessionalProfile } from "@/types/api";
import { User, Check, X } from "lucide-react";
import { useState } from "react";

export default function ProfissionaisPendentes() {
  const queryClient = useQueryClient();
  const [actionOpen, setActionOpen] = useState(false);
  const [selected, setSelected] = useState<ProfessionalProfile | null>(null);
  const [action, setAction] = useState<"APPROVED" | "REJECTED" | "SUSPENDED">("APPROVED");
  const [reason, setReason] = useState("");

  const { data: list = [] } = useQuery({
    queryKey: ["admin-professionals-pending"],
    queryFn: async () => {
      const res = await api.get<{ data?: ProfessionalProfile[] } | ProfessionalProfile[]>(adminApi.professionalsPending);
      const body = res.data as { data?: ProfessionalProfile[] } | ProfessionalProfile[];
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, action: a, reason: r }: { id: string; action: string; reason?: string }) => {
      await api.patch(adminApi.professionalStatus(id), { action: a, reason: r });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-professionals-pending"] });
      setActionOpen(false);
      setSelected(null);
      setReason("");
      toast.success("Ação aplicada!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleAction = () => {
    if (!selected) return;
    statusMutation.mutate({ id: selected.id, action, reason: reason || undefined });
  };

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Profissionais pendentes</h1>
      <p className="mt-2 text-muted-foreground">Aprovar, rejeitar ou suspender cadastros de profissionais.</p>

      {list.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhum pendente"
          description="Não há profissionais aguardando aprovação."
          className="mt-10"
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((prof) => (
            <Card key={prof.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={prof.user?.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(prof.displayName ?? prof.user?.name ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {prof.displayName ?? prof.user?.name ?? "Decorador"}
                    </p>
                    <p className="text-xs text-muted-foreground">{prof.user?.email}</p>
                  </div>
                </div>
                <Badge variant="secondary">Pendente</Badge>
              </CardHeader>
              <CardContent>
                {prof.bio && <p className="text-sm text-muted-foreground line-clamp-2">{prof.bio}</p>}
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full flex-1"
                    onClick={() => {
                      setSelected(prof);
                      setAction("APPROVED");
                      setActionOpen(true);
                    }}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full flex-1"
                    onClick={() => {
                      setSelected(prof);
                      setAction("REJECTED");
                      setActionOpen(true);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVED" ? "Aprovar" : action === "REJECTED" ? "Rejeitar" : "Suspender"} profissional
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <p className="text-sm text-muted-foreground">
              {selected.displayName ?? selected.user?.name ?? "Decorador"} — {selected.user?.email}
            </p>
          )}
          <div className="space-y-4 py-4">
            <div>
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Documentação incompleta"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              className="w-full rounded-full shadow-brand"
              onClick={handleAction}
              disabled={statusMutation.isPending}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
