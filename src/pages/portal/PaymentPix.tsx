import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import type { PixInfoResponse } from "@/types/api";
import { useState } from "react";
import { toast } from "sonner";

function formatAmount(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export default function PaymentPix() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { data: pixInfo, isLoading, error } = useQuery({
    queryKey: ["payments-pix-info", id],
    queryFn: async () => {
      const res = await api.get<PixInfoResponse>(`/payments/project/${id}/pix-info`);
      return res.data;
    },
    enabled: !!id,
  });

  const copyPixKey = () => {
    if (!pixInfo?.pixKey) return;
    navigator.clipboard.writeText(pixInfo.pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPayload = () => {
    if (!pixInfo?.pixPayload) return;
    navigator.clipboard.writeText(pixInfo.pixPayload);
    setCopied(true);
    toast.success("PIX copia e cola copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!id) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">ID do projeto não informado.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/app/projetos">Voltar aos projetos</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-md">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          <div className="mt-6 h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !pixInfo) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-md border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Não foi possível carregar as informações de pagamento. Verifique se o projeto possui um pagamento pendente.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-full w-full">
              <Link to={`/app/projetos/${id}`}>Voltar ao projeto</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayAmount = `R$ ${formatAmount(pixInfo.amount)}`;

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 rounded-full">
        <Link to={`/app/projetos/${id}`} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao projeto
        </Link>
      </Button>

      <div className="mx-auto max-w-md">
        <h1 className="text-display-md text-foreground">Pagamento PIX</h1>
        <p className="mt-2 text-muted-foreground">
          Pague o valor abaixo via PIX. O pagamento é creditado na conta da plataforma; após confirmação, o projeto segue normalmente.
        </p>

        <Card className="mt-8 overflow-hidden rounded-2xl border-2 border-primary/20 shadow-soft">
          <div className="gradient-brand px-6 py-6 text-white">
            <p className="text-sm font-medium opacity-90">Valor a pagar</p>
            <p className="mt-1 text-4xl font-bold">{displayAmount}</p>
            {pixInfo.description && (
              <p className="mt-2 text-sm opacity-90">{pixInfo.description}</p>
            )}
          </div>
          <CardContent className="p-6">
            {pixInfo.pixPayload ? (
              <>
                <Label className="mb-3 block text-center">Escaneie o QR code no app do seu banco</Label>
                <div className="flex justify-center rounded-xl bg-muted/50 p-4">
                  <QRCodeSVG value={pixInfo.pixPayload} size={220} level="M" />
                </div>
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground">PIX copia e cola</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      readOnly
                      value={pixInfo.pixPayload}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={copyPayload}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Label className="mb-3 block">Chave PIX para transferência</Label>
                <div className="flex gap-2">
                  <Input readOnly value={pixInfo.pixKey} className="font-mono" />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0 rounded-full"
                    onClick={copyPixKey}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tipo: <strong className="text-foreground">{pixInfo.pixKeyType}</strong>. Transfira {displayAmount} para esta chave e use a descrição do projeto como identificação.
                </p>
              </>
            )}

            <div className="mt-8 rounded-xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              Após o pagamento, em até alguns minutos o administrador confirmará o recebimento e o projeto seguirá para o decorador.
            </div>

            <Button asChild className="mt-6 w-full rounded-full shadow-brand">
              <Link to={`/app/projetos/${id}`}>Voltar ao projeto</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
