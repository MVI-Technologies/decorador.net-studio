import { useAuth } from "@/contexts/AuthContext";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet, Plus, History } from "lucide-react";
import type { Withdrawal } from "@/types/api";
import { useState } from "react";

export default function Pagamentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const { data: balanceData } = useQuery({
    queryKey: ["payments-balance"],
    queryFn: async () => {
      const res = await api.get<{ balance?: number }>("/payments/balance");
      return res.data;
    },
    enabled: user?.role === "PROFESSIONAL",
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["payments-withdrawals"],
    queryFn: async () => {
      const res = await api.get<{ data?: Withdrawal[] } | Withdrawal[]>("/payments/withdrawals");
      const body = res.data as { data?: Withdrawal[] } | Withdrawal[];
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
    enabled: user?.role === "PROFESSIONAL",
  });

  const withdrawMutation = useMutation({
    mutationFn: async (value: number) => {
      await api.post("/payments/withdraw", { amount: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments-balance"] });
      queryClient.invalidateQueries({ queryKey: ["payments-withdrawals"] });
      setAmount("");
      setWithdrawOpen(false);
      toast.success("Solicitação de saque enviada!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const balance = balanceData?.balance ?? 0;
  const minWithdraw = 10;

  const handleWithdraw = () => {
    const num = parseFloat(amount.replace(",", "."));
    if (isNaN(num) || num < minWithdraw) {
      toast.error(`Valor mínimo: R$ ${minWithdraw}`);
      return;
    }
    if (num > balance) {
      toast.error("Saldo insuficiente.");
      return;
    }
    withdrawMutation.mutate(num);
  };

  if (user?.role !== "PROFESSIONAL") {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Acesso restrito a profissionais.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Pagamentos</h1>
      <p className="mt-2 text-muted-foreground">Saldo disponível e histórico de saques.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="gradient-brand border-0 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5" />
              Saldo disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">R$ {balance.toFixed(2).replace(".", ",")}</p>
            <p className="mt-2 text-sm opacity-90">Valor liberado após aprovação dos clientes.</p>
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button
                  className="mt-6 rounded-full bg-white text-primary shadow-brand hover:bg-white/90"
                  size="lg"
                  disabled={balance < minWithdraw}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Solicitar saque (mín. R$ {minWithdraw})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar saque</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="text"
                      placeholder="Ex: 100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mínimo R$ {minWithdraw}. Saldo: R$ {balance.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    className="w-full rounded-full shadow-brand"
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending || !amount}
                  >
                    Enviar solicitação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de saques
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <EmptyState
                icon={History}
                title="Nenhum saque"
                description="Solicitações de saque aparecerão aqui."
              />
            ) : (
              <ul className="space-y-3">
                {withdrawals.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <span>R$ {w.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground">{w.status}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(w.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
