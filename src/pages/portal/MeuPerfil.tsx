import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { professionalStatusLabel } from "@/lib/projectStatus";
import type { ProfessionalProfile, Style, PortfolioItem } from "@/types/api";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

const profileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
  cpfCnpj: z.string().optional(),
  experienceYears: z.coerce.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  pixKey: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MeuPerfil() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [newPortfolioImageUrl, setNewPortfolioImageUrl] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["professional-profile"],
    queryFn: async () => {
      const res = await api.get<ProfessionalProfile>("/professionals/me/profile");
      return res.data;
    },
    enabled: user?.role === "PROFESSIONAL",
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          displayName: profile.displayName ?? "",
          bio: profile.bio ?? "",
          cpfCnpj: profile.cpfCnpj ?? "",
          experienceYears: profile.experienceYears ?? undefined,
          city: profile.city ?? "",
          state: profile.state ?? "",
          bankName: profile.bankName ?? "",
          bankAgency: profile.bankAgency ?? "",
          bankAccount: profile.bankAccount ?? "",
          pixKey: profile.pixKey ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      await api.patch("/professionals/me/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
      toast.success("Perfil atualizado!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const addStyleMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post("/professionals/me/styles", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
      setNewStyleName("");
      setStyleDialogOpen(false);
      toast.success("Estilo adicionado!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteStyleMutation = useMutation({
    mutationFn: async (styleId: string) => {
      await api.delete(`/professionals/me/styles/${styleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
      toast.success("Estilo removido!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const addPortfolioMutation = useMutation({
    mutationFn: async (payload: { title: string; imageUrl: string }) => {
      await api.post("/professionals/me/portfolio", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
      setNewPortfolioTitle("");
      setNewPortfolioImageUrl("");
      setPortfolioDialogOpen(false);
      toast.success("Item adicionado ao portfólio!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/professionals/me/portfolio/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
      toast.success("Item removido!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (user?.role !== "PROFESSIONAL") {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Acesso restrito a profissionais.</p>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-6 h-32 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  const styles = profile.styles ?? [];
  const portfolioItems = profile.portfolioItems ?? [];

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Meu perfil</h1>
      <p className="mt-2 text-muted-foreground">Dados do perfil profissional, estilos e portfólio.</p>
      <Badge variant="secondary" className="mt-4">{professionalStatusLabel[profile.status] ?? profile.status}</Badge>

      <Tabs defaultValue="perfil" className="mt-8">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="estilos">Estilos</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Dados profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de exibição</FormLabel>
                        <FormControl>
                          <Input placeholder="Como quer ser chamado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Sobre você e seu trabalho" rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experienceYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anos de experiência</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-foreground mb-4">Dados bancários</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banco</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do banco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="bankAgency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agência</FormLabel>
                              <FormControl>
                                <Input placeholder="0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bankAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conta</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="pixKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave PIX</FormLabel>
                            <FormControl>
                              <Input placeholder="CPF, e-mail ou telefone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="rounded-full shadow-brand" disabled={updateMutation.isPending}>
                    Salvar alterações
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="estilos" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Estilos</CardTitle>
              <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo estilo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      placeholder="Ex: Moderno, Minimalista"
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                    />
                    <Button
                      className="w-full rounded-full shadow-brand"
                      onClick={() => newStyleName.trim() && addStyleMutation.mutate(newStyleName.trim())}
                      disabled={addStyleMutation.isPending || !newStyleName.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {styles.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="Nenhum estilo"
                  description="Adicione estilos que você trabalha."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {styles.map((s) => (
                    <Badge key={s.id} variant="secondary" className="flex items-center gap-1 pr-1">
                      {s.name}
                      <button
                        type="button"
                        onClick={() => deleteStyleMutation.mutate(s.id)}
                        className="rounded p-0.5 hover:bg-muted"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="portfolio" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Portfólio</CardTitle>
              <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo item no portfólio</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      placeholder="Título"
                      value={newPortfolioTitle}
                      onChange={(e) => setNewPortfolioTitle(e.target.value)}
                    />
                    <Input
                      placeholder="URL da imagem"
                      value={newPortfolioImageUrl}
                      onChange={(e) => setNewPortfolioImageUrl(e.target.value)}
                    />
                    <Button
                      className="w-full rounded-full shadow-brand"
                      onClick={() =>
                        newPortfolioTitle.trim() &&
                        newPortfolioImageUrl.trim() &&
                        addPortfolioMutation.mutate({ title: newPortfolioTitle.trim(), imageUrl: newPortfolioImageUrl.trim() })
                      }
                      disabled={
                        addPortfolioMutation.isPending ||
                        !newPortfolioTitle.trim() ||
                        !newPortfolioImageUrl.trim()
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {portfolioItems.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="Nenhum item no portfólio"
                  description="Adicione imagens dos seus projetos."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="group relative overflow-hidden rounded-xl bg-muted">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <button
                          type="button"
                          onClick={() => deletePortfolioMutation.mutate(item.id)}
                          className="mt-2 text-sm text-destructive hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
