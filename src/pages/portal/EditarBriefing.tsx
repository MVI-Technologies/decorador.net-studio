import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/types/api";

const roomTypes = ["Sala", "Quarto", "Cozinha", "Banheiro", "Área externa", "Escritório", "Outro"];
const SEM_ESTILOS = "Sem estilos";
const styleOptions = [SEM_ESTILOS, "Moderno", "Minimalista", "Rústico", "Industrial", "Clássico", "Boho", "Tropical", "Escandinavo"];

const schema = z.object({
  projectTitle: z.string().min(2, "Título obrigatório"),
  roomType: z.string().optional(),
  roomSize: z.union([z.string(), z.number()]).optional().transform((v) => (v == null || v === "" ? "" : String(v))),
  budget: z.union([z.string(), z.number()]).optional().transform((v) => (v == null || v === "" ? "" : String(v))),
  description: z.string().optional(),
  stylePreferences: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/** Só permite editar briefing quando o projeto está em busca de profissional. */
const EDITABLE_STATUSES = ["MATCHING"];

export default function EditarBriefing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      const payload = res.data?.data ?? res.data ?? {};
      return (payload?.project ?? payload) as Project;
    },
    enabled: !!id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectTitle: "",
      roomType: "",
      roomSize: "",
      budget: "",
      description: "",
      stylePreferences: [],
      requirements: "",
      deadline: "",
    },
  });

  useEffect(() => {
    if (project?.briefing) {
      const b = project.briefing as { projectTitle?: string; roomType?: string; roomSize?: string; budget?: string; description?: string; stylePreferences?: string[]; requirements?: string; deadline?: string };
      const styles = Array.isArray(b.stylePreferences) && b.stylePreferences.length > 0 ? b.stylePreferences : [SEM_ESTILOS];
      setSelectedStyles(styles);
      form.reset({
        projectTitle: b.projectTitle ?? project.title ?? "",
        roomType: b.roomType ?? "",
        roomSize: b.roomSize != null ? String(b.roomSize) : "",
        budget: b.budget != null ? String(b.budget) : "",
        description: b.description ?? "",
        stylePreferences: styles,
        requirements: b.requirements ?? "",
        deadline: b.deadline ?? "",
      });
    } else if (project) {
      form.reset({
        projectTitle: project.title ?? "",
        roomType: "",
        roomSize: "",
        budget: "",
        description: "",
        stylePreferences: [],
        requirements: "",
        deadline: "",
      });
    }
  }, [project, form]);

  const roomType = form.watch("roomType");
  const roomSize = form.watch("roomSize");
  const budget = form.watch("budget");
  const description = form.watch("description");
  const projectTitle = form.watch("projectTitle");

  const checkedCount = [
    !!roomType,
    !!roomSize,
    !!budget,
    selectedStyles.length > 0,
    !!description,
  ].filter(Boolean).length;

  const toggleStyle = (s: string) => {
    if (s === SEM_ESTILOS) {
      setSelectedStyles([SEM_ESTILOS]);
      form.setValue("stylePreferences", []);
    } else {
      const withoutSemEstilos = selectedStyles.filter((x) => x !== SEM_ESTILOS);
      const next = withoutSemEstilos.includes(s) ? withoutSemEstilos.filter((x) => x !== s) : [...withoutSemEstilos, s];
      setSelectedStyles(next);
      form.setValue("stylePreferences", next);
    }
  };

  /** Enviamos [] quando "Sem estilos" ou vazio, para o backend tratar como "sem filtro por estilo" no match. */
  const stylesForApi = selectedStyles.includes(SEM_ESTILOS) || selectedStyles.length === 0
    ? []
    : selectedStyles;

  const patchMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const briefingId = (project?.briefing as { id?: string })?.id ?? project?.id ?? id;
      if (!briefingId) throw new Error("Briefing não encontrado");
      const budgetNum = values.budget ? parseInt(String(values.budget), 10) : undefined;
      await api.patch(`/briefings/${briefingId}`, {
        ...values,
        budget: budgetNum !== undefined && !Number.isNaN(budgetNum) ? budgetNum : undefined,
        stylePreferences: stylesForApi,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Briefing atualizado! Buscando decoradores.");
      navigate(`/app/projetos/${id}/match`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await patchMutation.mutateAsync({
        ...values,
        stylePreferences: stylesForApi,
      });
    } finally {
      setLoading(false);
    }
  }

  const canEdit = project && EDITABLE_STATUSES.includes(project.status);

  if (!id) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">ID não informado.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/app/projetos">Voltar</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-6 h-64 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Este briefing não pode ser editado.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to={`/app/projetos/${id}`}>Voltar ao projeto</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 rounded-full -ml-2">
        <Link to={`/app/projetos/${id}`} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao projeto
        </Link>
      </Button>

      <div className="mx-auto max-w-4xl">
        <h1 className="text-display-md text-foreground">Editar briefing</h1>
        <p className="mt-2 text-muted-foreground">
          Altere os dados do briefing para encontrar o decorador ideal.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="projectTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do projeto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sala de estar moderna" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-3 block">Tipo de cômodo</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {roomTypes.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => form.setValue("roomType", r)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
                          roomType === r
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {roomType === r && <Check className="h-4 w-4" />}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="roomSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metragem (m²)</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: 25" className="text-lg font-semibold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento (R$)</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ex: 5.000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-3 block">Estilos preferidos</Label>
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleStyle(s)}
                        className={cn(
                          "rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors",
                          selectedStyles.includes(s)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {selectedStyles.includes(s) && <Check className="mr-1 inline h-3.5 w-3.5" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do ambiente</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o ambiente, móveis que já tem, preferências..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos extras (opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Preciso de planta baixa, lista de compras..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="rounded-full shadow-brand px-8"
                  size="lg"
                  disabled={loading || patchMutation.isPending}
                >
                  {loading || patchMutation.isPending ? "Salvando…" : "Salvar e buscar decoradores"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl gradient-brand p-[1px] shadow-soft">
              <div className="rounded-2xl gradient-brand px-6 py-8 text-white">
                <h3 className="font-semibold text-lg">Projeto completo</h3>
                <p className="mt-1 text-sm opacity-90">Checklist do briefing</p>
                <ul className="mt-6 space-y-3">
                  {["Tipo de cômodo definido", "Metragem informada", "Orçamento indicado", "Estilo preferido escolhido", "Descrição do ambiente"].map((item, i) => {
                    const done = [!!roomType, !!roomSize, !!budget, selectedStyles.length > 0, !!description][i];
                    return (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        {done ? <Check className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-white/50" />}
                        <span className={done ? "" : "opacity-70"}>{item}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-sm opacity-80">
                  {checkedCount} de 5 itens
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
