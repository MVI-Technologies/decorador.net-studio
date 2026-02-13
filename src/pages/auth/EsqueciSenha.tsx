import { Link } from "react-router-dom";
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
import { useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormValues = z.infer<typeof schema>;

export default function EsqueciSenha() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      setSent(true);
      toast.success("Se esse e-mail existir, você receberá as instruções.");
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
            <h1 className="text-display-md text-foreground">Esqueci minha senha</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            {sent ? (
              <div className="mt-8 rounded-xl bg-muted p-6 text-center">
                <p className="text-sm text-foreground">
                  Verifique sua caixa de entrada e o spam. Se não receber em alguns minutos, tente novamente.
                </p>
                <Button asChild variant="outline" className="mt-4 rounded-full">
                  <Link to="/login">Voltar ao login</Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full rounded-full shadow-brand"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Enviando…" : "Enviar link"}
                  </Button>
                </form>
              </Form>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
