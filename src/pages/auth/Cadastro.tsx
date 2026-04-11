import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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
import { useAuth, getApiErrorMessage } from "@/contexts/AuthContext";
import { formatPhone } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["CLIENT", "PROFESSIONAL"]),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: roleParam === "professional" ? "PROFESSIONAL" : "CLIENT",
      phone: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        phone: values.phone || undefined,
      });
      if (values.role === "PROFESSIONAL") {
        toast.success("Cadastro realizado! Seu perfil está em análise pelo admin da plataforma.");
      } else {
        toast.success("Cadastro realizado! Faça login para continuar.");
      }
      window.location.replace("/login");
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
            <h1 className="text-display-md text-foreground">Cadastre-se</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie sua conta como cliente ou decorador profissional.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quem é você?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLIENT">Cliente (quero decorar)</SelectItem>
                          <SelectItem value="PROFESSIONAL">Decorador profissional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          {...field}
                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha (mín. 6 caracteres)</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} />
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
                  {loading ? "Cadastrando…" : "Criar conta"}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
