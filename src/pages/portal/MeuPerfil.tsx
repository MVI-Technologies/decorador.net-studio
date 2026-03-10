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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { professionalStatusLabel } from "@/lib/projectStatus";
import { STYLE_OPTIONS } from "@/lib/styles";
import type { ProfessionalProfile, Style, PortfolioItem } from "@/types/api";
import { Plus, Trash2, Image as ImageIcon, Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

const PORTFOLIO_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const PORTFOLIO_ACCEPT = "image/*,.pdf,.doc,.docx";

async function uploadPortfolioFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<{ url?: string; path?: string; data?: { url?: string; path?: string } }>(
    "/storage/upload",
    form,
    { params: { folder: "portfolio" } }
  );
  const data = res.data?.data ?? res.data;
  const url = (data as { url?: string })?.url ?? res.data?.url;
  if (!url) throw new Error("Resposta do upload sem url");
  return url;
}

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
  const [newStyleName, setNewStyleName] = useState("");
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioDrag, setPortfolioDrag] = useState(false);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const portfolioDropZoneRef = useRef<HTMLDivElement>(null);
  const [selectedPredefinedStyles, setSelectedPredefinedStyles] = useState<string[]>([]);
  const stylesDirtyRef = useRef(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["professional-profile"],
    queryFn: async (): Promise<ProfessionalProfile> => {
      const res = await api.get<ProfessionalProfile | { data?: ProfessionalProfile; profile?: ProfessionalProfile }>("/professionals/me/profile");
      const raw = res.data as Record<string, unknown> | undefined;
      if (!raw) return {} as ProfessionalProfile;
      const inner = (raw.data ?? raw.profile ?? raw) as ProfessionalProfile;
      const styles = Array.isArray(inner.styles) ? inner.styles : (raw.styles as Style[] | undefined) ?? [];
      return { ...inner, styles } as ProfessionalProfile;
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

  // Sincroniza a seleção com os estilos já salvos no perfil (vêm já circulados)
  useEffect(() => {
    if (!profile || stylesDirtyRef.current) return;
    const list = Array.isArray(profile.styles) ? profile.styles : [];
    const names = list
      .filter((s) => s?.name && STYLE_OPTIONS.includes(s.name as (typeof STYLE_OPTIONS)[number]))
      .map((s) => s.name);
    setSelectedPredefinedStyles(names);
  }, [profile, profile?.styles]);

  const saveStylesMutation = useMutation({
    mutationFn: async () => {
      const current = profile?.styles ?? [];
      const toAdd = selectedPredefinedStyles.filter((name) => !current.some((s) => s.name === name));
      const toRemove = current.filter((s) => STYLE_OPTIONS.includes(s.name as (typeof STYLE_OPTIONS)[number]) && !selectedPredefinedStyles.includes(s.name));
      for (const name of toAdd) {
        await api.post("/professionals/me/styles", { name });
      }
      for (const s of toRemove) {
        await api.delete(`/professionals/me/styles/${s.id}`);
      }
    },
    onSuccess: () => {
      stylesDirtyRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
      toast.success("Estilos salvos!");
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
      setPortfolioFile(null);
      setPortfolioDialogOpen(false);
      toast.success("Item adicionado ao portfólio!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleAddPortfolio = async () => {
    const title = newPortfolioTitle.trim();
    if (!title) return;
    if (!portfolioFile) {
      toast.error("Selecione ou arraste um arquivo.");
      return;
    }
    if (portfolioFile.size > PORTFOLIO_MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande. Máximo ${PORTFOLIO_MAX_FILE_SIZE / 1024 / 1024} MB.`);
      return;
    }
    try {
      const imageUrl = await uploadPortfolioFile(portfolioFile);
      addPortfolioMutation.mutate({ title, imageUrl });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const resetPortfolioDialog = () => {
    setNewPortfolioTitle("");
    setPortfolioFile(null);
  };

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
  const customStyles = styles.filter((s) => !STYLE_OPTIONS.includes(s.name as (typeof STYLE_OPTIONS)[number]));
  const selectedSet = new Set(selectedPredefinedStyles);
  const allPredefinedSelected = selectedSet.size === STYLE_OPTIONS.length;
  const savedPredefinedNames = (profile?.styles ?? [])
    .filter((s) => STYLE_OPTIONS.includes(s.name as (typeof STYLE_OPTIONS)[number]))
    .map((s) => s.name)
    .sort();
  const selectedSorted = [...selectedPredefinedStyles].sort();
  const hasStylesChanges =
    savedPredefinedNames.length !== selectedSorted.length ||
    savedPredefinedNames.some((n, i) => n !== selectedSorted[i]);
  const portfolioItems = profile.portfolioItems ?? [];

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Meu perfil</h1>
      <p className="mt-2 text-muted-foreground">Dados do perfil profissional, estilos e portfólio.</p>
      <Badge
        className={cn(
          "mt-4 border-0",
          profile.status === "APPROVED" || profile.status === "ACTIVE"
            ? "bg-green-100 text-green-700"
            : profile.status === "PENDING"
            ? "bg-red-100 text-red-600"
            : "bg-muted text-muted-foreground"
        )}
      >
        {professionalStatusLabel[profile.status] ?? profile.status}
      </Badge>

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
            <CardHeader>
              <CardTitle>Estilos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Mesmos estilos que o cliente escolhe no briefing — assim o match funciona. Marque os que você trabalha.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium">Estilos que você trabalha</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setSelectedPredefinedStyles(allPredefinedSelected ? [] : [...STYLE_OPTIONS]);
                      stylesDirtyRef.current = true;
                    }}
                    disabled={saveStylesMutation.isPending}
                  >
                    {allPredefinedSelected ? "Desmarcar todos" : "Selecionar todos"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((name) => {
                    const isSelected = selectedSet.has(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setSelectedPredefinedStyles((prev) =>
                            prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
                          );
                          stylesDirtyRef.current = true;
                        }}
                        disabled={saveStylesMutation.isPending}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Adicionar outro estilo</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Estilo que não está na lista acima (ex.: contemporâneo, mediterrâneo).
                </p>
                <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar mais
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo estilo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        placeholder="Ex: Contemporâneo, Mediterrâneo"
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
                {customStyles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {customStyles.map((s) => (
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
              </div>
              <Button
                type="button"
                className="rounded-full shadow-brand"
                onClick={() => saveStylesMutation.mutate()}
                disabled={saveStylesMutation.isPending || !hasStylesChanges}
              >
                {saveStylesMutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="portfolio" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Portfólio</CardTitle>
              <Dialog
                open={portfolioDialogOpen}
                onOpenChange={(open) => {
                  setPortfolioDialogOpen(open);
                  if (!open) resetPortfolioDialog();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo item no portfólio</DialogTitle>
                    <DialogDescription>
                      Envie uma imagem ou documento do seu projeto (PDF, JPG, PNG).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Título</label>
                      <Input
                        placeholder="Ex: Sala de estar, Projeto comercial"
                        value={newPortfolioTitle}
                        onChange={(e) => setNewPortfolioTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-3">Arquivo</p>
                      <div
                          ref={portfolioDropZoneRef}
                        className={cn(
                            "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                            portfolioDrag ? "border-primary bg-primary/5" : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                          )}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPortfolioDrag(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const related = e.relatedTarget as Node | null;
                            if (!portfolioDropZoneRef.current?.contains(related)) setPortfolioDrag(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPortfolioDrag(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) setPortfolioFile(file);
                          }}
                        >
                          <input
                            ref={portfolioFileInputRef}
                            type="file"
                            accept={PORTFOLIO_ACCEPT}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setPortfolioFile(file);
                              e.target.value = "";
                            }}
                          />
                          {portfolioFile ? (
                            <div>
                              <p className="font-medium text-foreground">{portfolioFile.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {(portfolioFile.size / 1024).toFixed(1)} KB · Máx. {PORTFOLIO_MAX_FILE_SIZE / 1024 / 1024} MB
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mt-2 rounded-full"
                                onClick={() => setPortfolioFile(null)}
                              >
                                Trocar arquivo
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-sm text-foreground font-medium">Arraste um arquivo aqui ou</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 rounded-full"
                                onClick={() => portfolioFileInputRef.current?.click()}
                              >
                                Selecionar arquivo
                              </Button>
                            </>
                          )}
                        </div>
                    </div>
                    <Button
                      className="w-full rounded-full shadow-brand"
                      onClick={handleAddPortfolio}
                      disabled={
                        addPortfolioMutation.isPending ||
                        !newPortfolioTitle.trim() ||
                        !portfolioFile
                      }
                    >
                      {addPortfolioMutation.isPending ? "Adicionando..." : "Adicionar"}
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
