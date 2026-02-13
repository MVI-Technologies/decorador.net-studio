import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { PaymentWithProject } from "@/types/api";
import { Wallet, Check } from "lucide-react";

export default function PagamentosRecebidos() {
  const queryClient = useQueryClient();

  const { data: list = [] } = useQuery({
    queryKey: ["admin-payments-pending-received"],
    queryFn: async () => {
      const res = await api.get<{ data?: PaymentWithProject[] } | PaymentWithProject[]>(
        "/admin/payments/pending-received"
      );
      const body = res.data as { data?: PaymentWithProject[] } | PaymentWithProject[];
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const markReceivedMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await api.patch(`/admin/payments/${paymentId}/mark-received`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments-pending-received"] });
      toast.success("Pagamento marcado como recebido!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Pagamentos aguardando recebimento</h1>
      <p className="mt-2 text-muted-foreground">
        Cliente já realizou ou vai realizar o PIX. Marque como recebido quando o valor cair na conta.
      </p>

      {list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum pagamento aguardando"
          description="Não há pagamentos pendentes de confirmação de recebimento."
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
                    ID: {payment.id} · Status: {payment.status}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={() => markReceivedMutation.mutate(payment.id)}
                  disabled={markReceivedMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Marcar como recebido
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
