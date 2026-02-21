import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/admin-api";
import type { AdminPixSettings, PixKeyType } from "@/types/api";
import { KeyRound } from "lucide-react";

const schema = z.object({
  pixKey: z.string().min(1, "Chave PIX obrigatória"),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
});

type FormValues = z.infer<typeof schema>;

const pixKeyTypeLabels: Record<PixKeyType, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  RANDOM: "Chave aleatória",
};

/** Normaliza resposta GET /admin/settings/pix (pode vir em res.data ou res.data.data, camelCase ou snake_case) */
function normalizePixSettings(res: unknown): { pixKey: string; pixKeyType: PixKeyType } {
  const raw = (res as { data?: Record<string, unknown> })?.data ?? (res as Record<string, unknown>);
  if (!raw || typeof raw !== "object") {
    return { pixKey: "", pixKeyType: "EMAIL" };
  }
  const inner = raw.data ?? raw;
  const obj = (typeof inner === "object" && inner !== null ? inner : raw) as Record<string, unknown>;
  const pixKey = String(obj.pixKey ?? obj.pix_key ?? "").trim();
  const pixKeyTypeRaw = String(obj.pixKeyType ?? obj.pix_key_type ?? "EMAIL").toUpperCase();
  const pixKeyType: PixKeyType =
    pixKeyTypeRaw === "CPF" || pixKeyTypeRaw === "CNPJ" || pixKeyTypeRaw === "EMAIL" || pixKeyTypeRaw === "PHONE" || pixKeyTypeRaw === "RANDOM"
      ? pixKeyTypeRaw
      : "EMAIL";
  return { pixKey, pixKeyType };
}

export default function ConfiguracoesPix() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings-pix"],
    queryFn: async () => {
      const res = await api.get(adminApi.settingsPix);
      return normalizePixSettings(res.data);
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pixKey: "", pixKeyType: "EMAIL" },
    values: settings
      ? {
          pixKey: settings.pixKey,
          pixKeyType: settings.pixKeyType as FormValues["pixKeyType"],
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await api.patch<unknown>(adminApi.settingsPix, { pixKey: data.pixKey, pixKeyType: data.pixKeyType });
      return normalizePixSettings(res.data ?? data);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["admin-settings-pix"], saved);
      queryClient.invalidateQueries({ queryKey: ["admin-settings-pix"] });
      toast.success("Chave PIX atualizada!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-6 h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Configurações PIX</h1>
      <p className="mt-2 text-muted-foreground">
        Chave PIX da plataforma. Os pagamentos dos clientes serão enviados para esta chave.
      </p>

      <Card className="mt-8 max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Chave PIX
          </CardTitle>
          <CardDescription>
            Configure a chave PIX (CPF, CNPJ, e-mail, telefone ou aleatória) que receberá os pagamentos dos projetos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="pixKeyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo da chave</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"] as const).map((t) => (
                          <SelectItem key={t} value={t}>
                            {pixKeyTypeLabels[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pixKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          form.watch("pixKeyType") === "EMAIL"
                            ? "email@exemplo.com"
                            : form.watch("pixKeyType") === "PHONE"
                              ? "(11) 99999-9999"
                              : "Valor da chave"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="rounded-full shadow-brand"
                disabled={updateMutation.isPending}
              >
                Salvar chave PIX
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
