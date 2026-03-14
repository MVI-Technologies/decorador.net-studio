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
import { adminApi } from "@/lib/admin-api";
import type { Withdrawal } from "@/types/api";
import { Wallet, Check, X, AlertCircle } from "lucide-react";
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
      const res = await api.get<{ data?: Withdrawal[] } | Withdrawal[]>(adminApi.withdrawalsPending);
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
      await api.patch(adminApi.withdrawalProcess(id), { action: a, adminNotes: notes });
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

      <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-amber-800">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>Aviso de Prazo:</strong> O repasse referente aos saques solicitados deve ser efetuado na conta bancária do profissional em até <strong>7 dias úteis</strong> a partir da data de solicitação. Fique atento aos prazos para evitar atrasos.
        </p>
      </div>

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
                  {(() => {
                    const daysPassed = Math.floor((new Date().getTime() - new Date(w.createdAt).getTime()) / (1000 * 3600 * 24));
                    if (daysPassed >= 7) {
                      return <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atenção: Solicitado há {daysPassed} dias (limite de 7 dias úteis próximo ou excedido!)</p>
                    } else if (daysPassed >= 5) {
                      return <p className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Fique atento: Solicitado há {daysPassed} dias.</p>
                    }
                    return null;
                  })()}
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
