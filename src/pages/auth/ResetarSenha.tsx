import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api, getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
    confirm: z.string().min(6, "Confirme a senha"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetarSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // Supabase appends access_token and type=recovery in the URL hash or query string.
  // react-router exposes query params; the hash must be parsed manually.
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Try query params first (some Supabase configs)
    let token = searchParams.get("access_token");

    // Then try hash fragment (default Supabase behavior)
    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      token = hashParams.get("access_token");
    }

    if (!token) {
      setTokenError(true);
    } else {
      setAccessToken(token);
    }
  }, [searchParams]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!accessToken) return;
    setLoading(true);
    try {
      await api.patch("/auth/reset-password", {
        accessToken,
        newPassword: values.password,
      });
      setDone(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            {tokenError ? (
              <div className="text-center">
                <p className="text-2xl mb-3">😕</p>
                <h1 className="text-display-md text-foreground mb-2">Link inválido</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Este link de redefinição é inválido ou expirou. Solicite um novo.
                </p>
                <Button asChild className="rounded-full px-8 shadow-brand">
                  <Link to="/esqueci-senha">Solicitar novo link</Link>
                </Button>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center text-center gap-4">
                <CheckCircle2 className="h-14 w-14 text-status-success" />
                <h1 className="text-display-md text-foreground">Senha redefinida!</h1>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para o login em instantes…
                </p>
                <Button asChild variant="outline" className="rounded-full mt-2">
                  <Link to="/login">Ir para o login</Link>
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-display-md text-foreground">Nova senha</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Escolha uma senha segura para sua conta.
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar nova senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full rounded-full shadow-brand"
                      size="lg"
                      disabled={loading || !accessToken}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando…
                        </>
                      ) : (
                        "Salvar nova senha"
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
