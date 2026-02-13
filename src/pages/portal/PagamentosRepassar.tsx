import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { PaymentWithProject } from "@/types/api";
import { Wallet, ArrowRight } from "lucide-react";

export default function PagamentosRepassar() {
  const queryClient = useQueryClient();

  const { data: list = [] } = useQuery({
    queryKey: ["admin-payments-pending-transfer"],
    queryFn: async () => {
      const res = await api.get<{ data?: PaymentWithProject[] } | PaymentWithProject[]>(
        "/admin/payments/pending-transfer"
      );
      const body = res.data as { data?: PaymentWithProject[] } | PaymentWithProject[];
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await api.patch(`/admin/payments/${paymentId}/mark-paid-to-professional`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments-pending-transfer"] });
      toast.success("Pagamento marcado como repassado ao profissional!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Pagamentos a repassar</h1>
      <p className="mt-2 text-muted-foreground">
        Pagamentos já recebidos (em escrow). Após repassar ao profissional fora do sistema, marque como pago.
      </p>

      {list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum pagamento a repassar"
          description="Não há pagamentos em escrow aguardando repasse ao profissional."
          className="mt-10"
        />
      ) : (
        <div className="mt-8 space-y-4">
          {list.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex flex-row flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <p className="font-semibold text-foreground">
                    R$ {payment.amount.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Projeto: {payment.project?.title ?? payment.projectId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {payment.id} · Repasse em até 4 dias úteis
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={() => markPaidMutation.mutate(payment.id)}
                  disabled={markPaidMutation.isPending}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Marcar como pago ao profissional
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
