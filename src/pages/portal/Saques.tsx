import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { Withdrawal } from "@/types/api";
import { Wallet, Check, X } from "lucide-react";
import { useState } from "react";

export default function Saques() {
  const queryClient = useQueryClient();
  const [processOpen, setProcessOpen] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [action, setAction] = useState<"COMPLETED" | "REJECTED">("COMPLETED");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: list = [] } = useQuery({
    queryKey: ["admin-withdrawals-pending"],
    queryFn: async () => {
      const res = await api.get<{ data?: Withdrawal[] } | Withdrawal[]>("/admin/withdrawals/pending");
      const body = res.data as { data?: Withdrawal[] } | Withdrawal[];
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({
      id,
      action: a,
      adminNotes: notes,
    }: {
      id: string;
      action: string;
      adminNotes?: string;
    }) => {
      await api.patch(`/admin/withdrawals/${id}/process`, { action: a, adminNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals-pending"] });
      setProcessOpen(false);
      setSelected(null);
      setAdminNotes("");
      toast.success("Processamento registrado!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleProcess = () => {
    if (!selected) return;
    processMutation.mutate({ id: selected.id, action, adminNotes: adminNotes || undefined });
  };

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Saques pendentes</h1>
      <p className="mt-2 text-muted-foreground">Processar solicitações de saque dos profissionais.</p>

      {list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum saque pendente"
          description="Não há saques aguardando processamento."
          className="mt-10"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {list.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex flex-row items-center justify-between gap-4 p-6">
                <div>
                  <p className="font-semibold text-foreground">R$ {w.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {w.id} · {new Date(w.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setSelected(w);
                      setAction("COMPLETED");
                      setProcessOpen(true);
                    }}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Concluir
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => {
                      setSelected(w);
                      setAction("REJECTED");
                      setProcessOpen(true);
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

      <Dialog open={processOpen} onOpenChange={setProcessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "COMPLETED" ? "Concluir" : "Rejeitar"} saque
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <p className="text-sm text-muted-foreground">
              Valor: R$ {selected.amount.toFixed(2)}
            </p>
          )}
          <div className="space-y-4 py-4">
            <div>
              <Label>Observações (opcional)</Label>
              <Input
                placeholder="Notas internas"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              className="w-full rounded-full shadow-brand"
              onClick={handleProcess}
              disabled={processMutation.isPending}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
