import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const roomTypes = ["Sala", "Quarto", "Cozinha", "Banheiro", "Área externa", "Escritório", "Outro"];
const styleOptions = ["Moderno", "Minimalista", "Rústico", "Industrial", "Clássico", "Boho", "Tropical", "Escandinavo"];

const schema = z.object({
  projectTitle: z.string().min(2, "Título obrigatório"),
  roomType: z.string().optional(),
  roomSize: z.string().optional(),
  budget: z.string().optional(),
  description: z.string().optional(),
  stylePreferences: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const checklistItems = [
  "Tipo de cômodo definido",
  "Metragem informada",
  "Orçamento indicado",
  "Estilo preferido escolhido",
  "Descrição do ambiente",
];

export default function NovoBriefing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

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
    const next = selectedStyles.includes(s) ? selectedStyles.filter((x) => x !== s) : [...selectedStyles, s];
    setSelectedStyles(next);
    form.setValue("stylePreferences", next);
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await api.post<{ project: { id: string }; briefing: unknown }>("/briefings", {
        ...values,
        stylePreferences: selectedStyles.length ? selectedStyles : undefined,
      });
      toast.success("Briefing criado! Redirecionando ao match.");
      navigate(`/app/projetos/${res.data.project.id}/match`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-display-md text-foreground">Novo briefing</h1>
        <p className="mt-2 text-muted-foreground">Conte o que você precisa para encontrarmos o decorador ideal.</p>

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

                <Button type="submit" className="rounded-full shadow-brand px-8" size="lg" disabled={loading}>
                  {loading ? "Criando…" : "Criar briefing e buscar decoradores"}
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
                  {checklistItems.map((item, i) => {
                    const done = [
                      !!roomType,
                      !!roomSize,
                      !!budget,
                      selectedStyles.length > 0,
                      !!description,
                    ][i];
                    return (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        {done ? <Check className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-white/50" />}
                        <span className={done ? "" : "opacity-70"}>{item}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-sm opacity-80">
                  {checkedCount} de {checklistItems.length} itens
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
