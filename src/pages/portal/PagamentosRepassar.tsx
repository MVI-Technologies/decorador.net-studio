import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { adminApi } from "@/lib/admin-api";
import type { PaymentPendingTransfer } from "@/types/api";
import { Wallet, ArrowRight, AlertCircle } from "lucide-react";

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function PagamentosRepassar() {
  const queryClient = useQueryClient();

  const { data: list = [] } = useQuery({
    queryKey: ["admin-payments-pending-transfer"],
    queryFn: async () => {
      const res = await api.get<{ data?: PaymentPendingTransfer[] } | PaymentPendingTransfer[]>(
        adminApi.paymentsPendingTransfer
      );
      const body = res.data as { data?: PaymentPendingTransfer[] } | PaymentPendingTransfer[];
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await api.patch(adminApi.paymentMarkPaidToProfessional(paymentId));
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

      <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-amber-800">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>Aviso de Prazo:</strong> O repasse referente aos projetos finalizados deve ser efetuado na conta bancária do profissional em até <strong>7 dias úteis</strong>. Fique atento aos prazos para evitar atrasos.
        </p>
      </div>

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
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Projeto: <span className="font-medium text-foreground">{payment.projectTitle}</span>
                  </p>
                  <p className="font-semibold text-foreground">
                    Valor total do projeto: {formatBRL(payment.totalAmount)}
                  </p>
                  <p className="font-semibold text-primary">
                    Valor a repassar ao profissional: {formatBRL(payment.amountToTransfer)}
                  </p>
                  {payment.platformFee > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Taxa da plataforma: {formatBRL(payment.platformFee)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Cliente: <span className="text-foreground">{payment.clientName}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Profissional: <span className="text-foreground">{payment.professionalName}</span>
                  </p>
                  {payment.professionalPixKey ? (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Chave PIX para repasse: </span>
                      <span className="font-medium text-foreground break-all">{payment.professionalPixKey}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-500">
                      Chave PIX não cadastrada. Peça ao profissional para cadastrar a chave PIX no perfil.
                    </p>
                  )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {payment.escrowStartedAt
                        ? `Em escrow desde: ${new Date(payment.escrowStartedAt).toLocaleDateString("pt-BR")}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {payment.id} · Repasse em até 7 dias úteis
                    </p>
                    {payment.escrowStartedAt && (() => {
                      const daysPassed = Math.floor((new Date().getTime() - new Date(payment.escrowStartedAt).getTime()) / (1000 * 3600 * 24));
                      if (daysPassed >= 7) {
                        return <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atenção: Repasse pendente há {daysPassed} dias (limite próximo ou excedido!)</p>
                      } else if (daysPassed >= 5) {
                        return <p className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Fique atento: Repasse pendente há {daysPassed} dias.</p>
                      }
                      return null;
                    })()}
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
