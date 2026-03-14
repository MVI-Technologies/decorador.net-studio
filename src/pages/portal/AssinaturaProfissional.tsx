import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/button";
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
      // Redirecionar para o Checkout do Mercado Pago
      window.location.href = data.checkoutUrl;
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
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mensalidade da Plataforma</h1>
        <p className="text-gray-400">
          Para aceitar projetos, iniciar conversas e ter visibilidade, você precisa estar com a sua assinatura mensal ativa.
        </p>
      </div>

      <div className="bg-[#1A1F2C] border border-[#2A2F3C] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2F3C]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Status Atual</h2>
            {isUpToDate ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ativa
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 mr-2" />
                {status?.status === "PAST_DUE" ? "Pendente" : "Inativa"}
              </span>
            )}
          </div>

          {!isUpToDate && (
            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Sua mensalidade não está ativa. Clientes não poderão selecionar você para novos projetos até que o pagamento seja regularizado.
              </AlertDescription>
            </Alert>
          )}

          {isUpToDate && status?.expiresAt && (
            <div className="mt-4 text-sm text-gray-400">
              Próxima cobrança programada para: <span className="text-white font-medium">{format(new Date(status.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#1A1F2C]/50">
          <h3 className="text-lg font-medium text-white mb-4">Plano Assinatura Mensal</h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#2A2F3C]/50 border border-[#3A3F4C] mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-white">Decorador Premium</div>
                <div className="text-sm text-gray-400">Cobrado mensalmente via Mercado Pago</div>
              </div>
            </div>
            {/* O valor seria melhor vir do backend, mas simplificaremos para a interface no momento */}
            <div className="text-right">
              <div className="text-2xl font-bold text-white">R$ 21<span className="text-lg text-gray-400">,90</span></div>
              <div className="text-sm text-gray-400">/ mês</div>
            </div>
          </div>

          <Button 
            onClick={handleSubscribe} 
            disabled={submitting || isUpToDate}
            className="w-full text-lg h-12"
          >
            {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isUpToDate ? "Assinatura Ativa" : "Assinar Agora"}
          </Button>

          <p className="mt-4 text-xs text-center text-gray-500">
            Pagamento seguro processado pelo Mercado Pago. Você será redirecionado para concluir a assinatura.
          </p>
        </div>
      </div>
    </div>
  );
}
