/**
 * AssinaturaRetorno.tsx
 *
 * Página de retorno após o checkout de assinatura do Mercado Pago.
 * O MP redireciona o profissional para esta rota após o checkout:
 *   https://app.decorador.net/app/assinatura/retorno?preapproval_id=XXX&status=authorized
 *
 * Fluxo:
 *   1. Lê preapproval_id e status da URL
 *   2. Chama GET /subscriptions/verify/:preapprovalId para ativação imediata
 *   3. Faz polling em GET /subscriptions/status até confirmar ACTIVE
 *   4. Exibe feedback visual e CTA para voltar à página de assinatura
 */

import { useEffect, useState } from "react";
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
  const preapprovalId = searchParams.get("preapproval_id");
  const urlStatus = searchParams.get("status"); // authorized | pending | cancelled

  const [verifyDone, setVerifyDone] = useState(false);
  const [verifyError, setVerifyError] = useState(false);

  // 1. Chamar verify imediatamente ao montar (uma única vez)
  useEffect(() => {
    if (!preapprovalId) {
      setVerifyDone(true);
      return;
    }

    api
      .get<VerifySubscriptionResponse>(`/subscriptions/verify/${preapprovalId}`)
      .then(() => setVerifyDone(true))
      .catch(() => {
        setVerifyError(true);
        setVerifyDone(true);
      });
  }, [preapprovalId]);

  // 2. Polling no status até ACTIVE (máximo 60s)
  const { data: statusData } = useQuery({
    queryKey: ["subscription-status-return"],
    queryFn: async () => {
      const res = await api.get<SubscriptionStatusResponse>("/subscriptions/status");
      return res.data;
    },
    enabled: verifyDone,
    refetchInterval: (query) => {
      if (query.state.data?.status === "ACTIVE") return false;
      return 5_000;
    },
    refetchIntervalInBackground: false,
  });

  const isActive = statusData?.status === "ACTIVE";
  const isCancelled = urlStatus === "cancelled" || urlStatus === "failure";
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

            {/* Metadata */}
            {preapprovalId && (
              <div className="mt-6 rounded-xl bg-muted/50 p-4 text-left space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>ID da assinatura</span>
                  <span className="font-mono font-medium text-foreground">{preapprovalId}</span>
                </div>
                {urlStatus && (
                  <div className="flex items-center justify-between">
                    <span>Status MP</span>
                    <span className="font-medium text-foreground capitalize">{urlStatus}</span>
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
