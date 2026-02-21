import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";

interface ProposalFormProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalForm({ projectId, open, onOpenChange }: ProposalFormProps) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState("");
  const [packageType, setPackageType] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const num = parseFloat(price.replace(",", "."));
      if (isNaN(num) || num <= 0) throw new Error("Informe um valor válido.");
      const msg = notes.trim().slice(0, 2000) || undefined;
      await api.post(`/proposals/${projectId}`, {
        price: num,
        packageType: packageType.trim() || undefined,
        deadlineDays: estimatedDays ? parseInt(estimatedDays, 10) : undefined,
        message: msg,
      });
    },
    onSuccess: () => {
      toast.success("Proposta enviada! O cliente será notificado.");
      queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["chat", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["professional-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-chats"] });
      queryClient.invalidateQueries({ queryKey: ["professional-projects-chats"] });
      onOpenChange(false);
      setPrice("");
      setPackageType("");
      setEstimatedDays("");
      setNotes("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Enviar proposta
          </DialogTitle>
          <DialogDescription>
            Detalhe o valor, escopo e prazo. O cliente verá a proposta diretamente no chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="proposal-price">Valor (R$) *</Label>
            <Input
              id="proposal-price"
              type="text"
              inputMode="decimal"
              placeholder="2.500,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="proposal-package">
              Pacote / Escopo{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="proposal-package"
              placeholder="Ex.: Básico, Completo, Premium"
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="proposal-days">
              Prazo estimado (dias){" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="proposal-days"
              type="number"
              min="1"
              placeholder="30"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="proposal-notes">
              Observações{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="proposal-notes"
              placeholder="O que está incluso, limite de revisões, materiais, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1.5 resize-none"
            />
          </div>

          <Button
            className="w-full rounded-full shadow-brand"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !price.trim()}
          >
            {mutation.isPending ? "Enviando..." : "Enviar proposta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
