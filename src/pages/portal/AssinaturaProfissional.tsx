import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SubscriptionStatusResponse, SubscribeResponse } from "@/types/api";

export default function AssinaturaProfissional() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<SubscriptionStatusResponse>("/subscriptions/status");
      setStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status da assinatura", error);
      toast.error("Não foi possível carregar o status da sua assinatura");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setSubmitting(true);
      const { data } = await api.post<SubscribeResponse>("/subscriptions/subscribe");
      
      const url = data?.checkoutUrl;
      if (!url) {
        toast.error("Link de pagamento não retornado pelo servidor. Tente novamente.");
        return;
      }
      
      // Redireciona na mesma janela — o MP retorna via back_url para /app/assinatura/retorno
      toast.success("Redirecionando para o Mercado Pago...");
      window.location.href = url;
    } catch (error: any) {
      console.error("Erro ao gerar link de assinatura", error);
      toast.error(error.response?.data?.message || "Erro ao gerar link de pagamento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isUpToDate = status?.status === "ACTIVE";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Mensalidade da Plataforma</h1>
        <p className="text-muted-foreground">
          Para aceitar projetos, iniciar conversas e ter visibilidade, você precisa estar com a sua assinatura mensal ativa.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Status Atual</h2>
            {isUpToDate ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-status-success/10 text-status-success border border-status-success/20">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ativa
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="w-4 h-4 mr-2" />
                {status?.status === "PAST_DUE" ? "Pendente" : "Inativa"}
              </span>
            )}
          </div>

          {!isUpToDate && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Sua mensalidade não está ativa. Clientes não poderão selecionar você para novos projetos até que o pagamento seja regularizado.
              </AlertDescription>
            </Alert>
          )}

          {isUpToDate && status?.expiresAt && (
            <div className="mt-4 text-sm text-muted-foreground">
              Próxima cobrança programada para: <span className="text-foreground font-medium">{format(new Date(status.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-muted/30">
          <h3 className="text-lg font-medium text-foreground mb-4">Plano Assinatura Mensal</h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Decorador Premium</div>
                <div className="text-sm text-muted-foreground">Aceita PIX, Cartão e Boleto através do Mercado Pago</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                R$ {(status?.monthlyFee || 1.00).toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-muted-foreground">/ mês</div>
            </div>
          </div>

          <Button 
            onClick={handleSubscribe} 
            disabled={submitting || isUpToDate}
            className="w-full text-lg h-12"
          >
            {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isUpToDate ? "Assinatura Ativa" : "Pagar Mensalidade"}
          </Button>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Pagamento seguro processado pelo Mercado Pago. Renovação feita por este painel a cada mês.
          </p>
        </div>
      </div>
    </div>
  );
}
