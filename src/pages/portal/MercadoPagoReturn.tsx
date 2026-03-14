/**
 * MercadoPagoReturn.tsx
 *
 * Página de retorno após o checkout do Mercado Pago.
 * O MP redireciona o cliente para esta rota nas seguintes situações:
 *   - success:  back_urls.success  → /app/projetos/:id/pagamento/sucesso
 *   - failure:  back_urls.failure  → /app/projetos/:id/pagamento/falha
 *   - pending:  back_urls.pending  → /app/projetos/:id/pagamento/pendente
 *
 * A confirmação REAL do pagamento ocorre via webhook no backend.
 * Esta página apenas informa o usuário sobre o resultado provisório
 * e faz polling no projeto para detectar quando o status mudar.
 */

import { Link, useParams, useSearchParams } from "react-router-dom";
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
  ExternalLink,
} from "lucide-react";
import type { Project } from "@/types/api";

type ReturnType = "sucesso" | "falha" | "pendente";

const CONTENT = {
  sucesso: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    cardClass: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
    title: "Pagamento concluído!",
    description:
      "Seu pagamento foi processado. O projeto entrará em andamento assim que o Mercado Pago confirmar a transação (isso pode levar alguns instantes).",
    cta: "Ver projeto",
  },
  pendente: {
    icon: Clock,
    iconClass: "text-amber-500",
    cardClass: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    title: "Pagamento em processamento",
    description:
      "Seu pagamento está sendo processado. Assim que for confirmado, o projeto entrará em andamento automaticamente. Você pode fechar esta página.",
    cta: "Acompanhar projeto",
  },
  falha: {
    icon: XCircle,
    iconClass: "text-destructive",
    cardClass: "border-destructive/30 bg-destructive/5",
    title: "Pagamento não concluído",
    description:
      "O pagamento não foi aprovado. Você pode tentar novamente pelo botão abaixo — o link de pagamento continua válido.",
    cta: "Tentar novamente",
  },
};

export default function MercadoPagoReturn() {
  const { id, type } = useParams<{ id: string; type: ReturnType }>();
  const [searchParams] = useSearchParams();
  const returnType: ReturnType =
    type === "sucesso" || type === "falha" || type === "pendente"
      ? type
      : "pendente";

  const content = CONTENT[returnType];
  const Icon = content.icon;

  // Polling no projeto para detectar mudança de status via webhook
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      const payload = res.data?.data ?? res.data ?? {};
      return (payload?.project ?? payload) as Project;
    },
    enabled: !!id,
    // Atualizar a cada 5 segundos para capturar confirmação via webhook
    refetchInterval: (query) => {
      const d = query.state.data as Project | undefined;
      // Parar o polling quando o projeto entrar em andamento
      if (d?.status === "IN_PROGRESS") return false;
      if (returnType === "falha") return false;
      return 5_000;
    },
  });

  const isInProgress = project?.status === "IN_PROGRESS";
  const paymentId = searchParams.get("payment_id");
  const collectionStatus = searchParams.get("collection_status");

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 rounded-full">
        <Link to={`/app/projetos/${id}`} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao projeto
        </Link>
      </Button>

      <div className="mx-auto max-w-lg">
        {/* Card principal */}
        <Card className={`overflow-hidden rounded-2xl border-2 ${content.cardClass}`}>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <Icon className={`h-16 w-16 ${content.iconClass}`} />
            </div>

            <h1 className="text-2xl font-bold text-foreground">
              {/* Se o webhook já chegou e o projeto está IN_PROGRESS, exibir confirmação real */}
              {isInProgress ? "Projeto em andamento! 🎉" : content.title}
            </h1>

            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              {isInProgress
                ? "O pagamento foi confirmado e o decorador já pode começar a trabalhar no seu projeto!"
                : content.description}
            </p>

            {/* Polling indicator */}
            {(returnType === "sucesso" || returnType === "pendente") &&
              !isInProgress &&
              !isLoading && (
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando confirmação do Mercado Pago...
                </div>
              )}

            {/* Metadata do pagamento */}
            {(paymentId || collectionStatus) && (
              <div className="mt-6 rounded-xl bg-muted/50 p-4 text-left space-y-1.5 text-xs text-muted-foreground">
                {paymentId && (
                  <div className="flex items-center justify-between">
                    <span>ID do pagamento</span>
                    <span className="font-mono font-medium text-foreground">
                      {paymentId}
                    </span>
                  </div>
                )}
                {collectionStatus && (
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-medium text-foreground capitalize">
                      {collectionStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="mt-8 space-y-3">
              {returnType === "falha" && project?.paymentCheckoutUrl ? (
                <>
                  <Button asChild className="w-full rounded-full shadow-brand">
                    <a href={project.paymentCheckoutUrl}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Tentar pagamento novamente
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link to={`/app/projetos/${id}`}>Ver projeto</Link>
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  className="w-full rounded-full shadow-brand"
                >
                  <Link to={`/app/projetos/${id}`}>{content.cta}</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nota de segurança */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          🔒 A confirmação do pagamento é realizada diretamente pelo Mercado Pago.
          Seu dinheiro fica protegido até a conclusão do projeto.
        </p>
      </div>
    </div>
  );
}
