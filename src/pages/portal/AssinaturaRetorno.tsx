/**
 * AssinaturaRetorno.tsx
 *
 * Página de retorno após o checkout de assinatura do Mercado Pago.
 * O MP redireciona o profissional para esta rota após o checkout:
 *   /app/assinatura/retorno?origin=success&payment_id=123&status=approved&...
 *
 * Fluxo:
 *   1. Lê payment_id e status da URL (injetados pelo MP automaticamente)
 *   2. Chama GET /subscriptions/verify-payment?payment_id=xxx para ativação imediata
 *   3. Faz polling em GET /subscriptions/status até confirmar ACTIVE (fallback)
 *   4. Exibe feedback visual e CTA para voltar à página de assinatura
 */

import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import type { SubscriptionStatusResponse, VerifySubscriptionResponse } from "@/types/api";

export default function AssinaturaRetorno() {
  const [searchParams] = useSearchParams();

  // O MP injeta esses query params na URL de retorno automaticamente
  const paymentId =
    searchParams.get("payment_id") ||
    searchParams.get("collection_id") ||
    searchParams.get("preapproval_id");
  const origin = searchParams.get("origin"); // success | failure | pending (nosso param)
  const collectionStatus =
    searchParams.get("collection_status") ||
    searchParams.get("status"); // approved | pending | null

  const [verifyDone, setVerifyDone] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifySubscriptionResponse | null>(null);
  const [verifyError, setVerifyError] = useState(false);
  const hasTriedVerify = useRef(false);

  // 1. Chamar verify-payment imediatamente ao montar (uma única vez)
  useEffect(() => {
    // Se não tem paymentId ou já foi cancelado/falha, não tenta verificar
    if (!paymentId || origin === "failure") {
      setVerifyDone(true);
      return;
    }

    // Prevenir chamadas duplas em React.StrictMode
    if (hasTriedVerify.current) return;
    hasTriedVerify.current = true;

    api
      .get<VerifySubscriptionResponse>(`/subscriptions/verify-payment`, {
        params: { payment_id: paymentId },
      })
      .then((res) => {
        setVerifyResult(res.data);
        setVerifyDone(true);
      })
      .catch((err) => {
        console.error("[AssinaturaRetorno] Erro no verify-payment:", err);
        setVerifyError(true);
        setVerifyDone(true);
      });
  }, [paymentId, origin]);

  // 2. Polling no status até ACTIVE (fallback para quando o verify-payment
  //    não ativou imediatamente — ex: PIX ainda pendente)
  const { data: statusData } = useQuery({
    queryKey: ["subscription-status-return"],
    queryFn: async () => {
      const res = await api.get<SubscriptionStatusResponse>("/subscriptions/status");
      return res.data;
    },
    enabled: verifyDone && !verifyResult?.activated && origin !== "failure",
    refetchInterval: (query) => {
      if (query.state.data?.status === "ACTIVE") return false;
      return 5_000; // 5 segundos
    },
    refetchIntervalInBackground: false,
  });

  // Definitivo: ativo se o verify-payment confirmou OU se o polling achou ACTIVE
  const isActive = verifyResult?.activated || statusData?.status === "ACTIVE";
  const isCancelled = origin === "failure";
  const isPending = !isActive && !isCancelled;

  // ── Conteúdo dinâmico por estado ──────────────────────────────────────────

  const content = isActive
    ? {
        icon: CheckCircle2,
        iconClass: "text-status-success",
        cardClass: "border-2 border-status-success/20 bg-status-success/5",
        title: "Assinatura ativa! 🎉",
        description:
          "Seu pagamento foi confirmado. Sua assinatura está ativa e você já pode aceitar novos projetos na plataforma.",
      }
    : isCancelled
    ? {
        icon: XCircle,
        iconClass: "text-destructive",
        cardClass: "border-2 border-destructive/20 bg-destructive/5",
        title: "Pagamento não concluído",
        description:
          "O checkout foi cancelado ou ocorreu um problema. Você pode tentar assinar novamente pela página de assinatura.",
      }
    : {
        icon: Clock,
        iconClass: "text-status-warning",
        cardClass: "border-2 border-status-warning/20 bg-status-warning/5",
        title: "Pagamento em processamento",
        description:
          "Seu pagamento está sendo confirmado pelo Mercado Pago. Aguarde alguns instantes — atualizaremos automaticamente quando concluído.",
      };

  const Icon = content.icon;

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 rounded-full">
        <Link to="/app/assinatura" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Assinatura
        </Link>
      </Button>

      <div className="mx-auto max-w-lg">
        <Card className={`overflow-hidden rounded-2xl ${content.cardClass}`}>
          <CardContent className="p-8 text-center">
            {/* Ícone */}
            <div className="flex justify-center mb-4">
              {!verifyDone && !isCancelled ? (
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              ) : (
                <Icon className={`h-16 w-16 ${content.iconClass}`} />
              )}
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-foreground">
              {!verifyDone && !isCancelled ? "Verificando pagamento..." : content.title}
            </h1>

            {/* Descrição */}
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              {!verifyDone && !isCancelled
                ? "Estamos confirmando sua assinatura com o Mercado Pago, aguarde..."
                : content.description}
            </p>

            {/* Polling indicator */}
            {isPending && verifyDone && !verifyError && (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando confirmação automática...
              </div>
            )}

            {/* Erro no verify */}
            {verifyError && !isActive && (
              <div className="mt-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-left text-xs text-destructive">
                Não foi possível verificar o pagamento automaticamente. Se você pagou, aguarde
                alguns minutos — processaremos assim que o Mercado Pago confirmar.
              </div>
            )}

            {/* Metadata */}
            {paymentId && (
              <div className="mt-6 rounded-xl bg-muted/50 p-4 text-left space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>ID do pagamento</span>
                  <span className="font-mono font-medium text-foreground">{paymentId}</span>
                </div>
                {collectionStatus && (
                  <div className="flex items-center justify-between">
                    <span>Status MP</span>
                    <span className="font-medium text-foreground capitalize">{collectionStatus}</span>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="mt-8">
              <Button asChild className="w-full rounded-full shadow-brand">
                <Link to="/app/assinatura">
                  {isActive ? "Ver minha assinatura" : "Voltar à página de assinatura"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          🔒 A confirmação do pagamento é processada diretamente pelo Mercado Pago de forma segura.
        </p>
      </div>
    </div>
  );
}
