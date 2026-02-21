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
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { SEM_ESTILOS, styleOptionsForClient } from "@/lib/styles";

const ROOM_TYPES_PREDEFINED = ["Sala", "Quarto", "Cozinha", "Banheiro", "Área externa", "Escritório"];
const styleOptions = styleOptionsForClient;

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
  const [newCustomStyle, setNewCustomStyle] = useState("");
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [showOtherRoomInput, setShowOtherRoomInput] = useState(false);
  const [newCustomRoom, setNewCustomRoom] = useState("");

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

  const roomSize = form.watch("roomSize");
  const budget = form.watch("budget");
  const description = form.watch("description");
  const projectTitle = form.watch("projectTitle");

  const syncRoomTypesToForm = (rooms: string[]) => {
    form.setValue("roomType", rooms.join(", "));
  };

  const toggleRoomType = (r: string) => {
    const next = selectedRoomTypes.includes(r)
      ? selectedRoomTypes.filter((x) => x !== r)
      : [...selectedRoomTypes, r];
    setSelectedRoomTypes(next);
    syncRoomTypesToForm(next);
  };

  const addCustomRoom = () => {
    const name = newCustomRoom.trim();
    if (!name || selectedRoomTypes.includes(name)) return;
    const next = [...selectedRoomTypes, name];
    setSelectedRoomTypes(next);
    syncRoomTypesToForm(next);
    setNewCustomRoom("");
    setShowOtherRoomInput(false);
  };

  const removeRoomType = (r: string) => {
    const next = selectedRoomTypes.filter((x) => x !== r);
    setSelectedRoomTypes(next);
    syncRoomTypesToForm(next);
  };

  const customRoomTypes = selectedRoomTypes.filter((r) => !ROOM_TYPES_PREDEFINED.includes(r));

  const checkedCount = [
    selectedRoomTypes.length > 0,
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

  const customStyles = selectedStyles.filter((s) => !styleOptions.includes(s));

  const addCustomStyle = () => {
    const name = newCustomStyle.trim();
    if (!name || selectedStyles.includes(name)) return;
    const withoutSemEstilos = selectedStyles.filter((x) => x !== SEM_ESTILOS);
    const next = [...withoutSemEstilos, name];
    setSelectedStyles(next);
    form.setValue("stylePreferences", next);
    setNewCustomStyle("");
  };

  const removeCustomStyle = (name: string) => {
    const next = selectedStyles.filter((x) => x !== name);
    setSelectedStyles(next);
    form.setValue("stylePreferences", next);
  };

  /** Enviamos [] quando "Sem estilos" ou vazio, para o backend tratar como "sem filtro por estilo" no match. */
  const stylesForApi = selectedStyles.includes(SEM_ESTILOS) || selectedStyles.length === 0
    ? []
    : selectedStyles;

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const budgetNum = values.budget ? parseInt(String(values.budget), 10) : undefined;
      const res = await api.post("/briefings", {
        ...values,
        budget: budgetNum !== undefined && !Number.isNaN(budgetNum) ? budgetNum : undefined,
        stylePreferences: stylesForApi,
      });
      const payload = res.data?.data ?? res.data ?? {};
      const project = payload?.project ?? payload;
      const projectId = project?.id ?? (project as { id?: string })?.id;
      if (!projectId) throw new Error("Resposta inválida: projeto sem ID");
      toast.success("Briefing criado! Redirecionando ao match.");
      navigate(`/app/projetos/${projectId}/match`);
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
                  <p className="text-xs text-muted-foreground mb-2">Selecione um ou mais. Clique em &quot;Outro&quot; para adicionar um cômodo que não está na lista.</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ROOM_TYPES_PREDEFINED.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRoomType(r)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
                          selectedRoomTypes.includes(r)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {selectedRoomTypes.includes(r) && <Check className="h-4 w-4" />}
                        {r}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowOtherRoomInput((v) => !v)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors",
                        showOtherRoomInput ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      Outro
                    </button>
                  </div>
                  {showOtherRoomInput && (
                    <div className="mt-3 flex gap-2 items-center">
                      <Input
                        placeholder="Ex: Varanda, Lavanderia"
                        value={newCustomRoom}
                        onChange={(e) => setNewCustomRoom(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRoom())}
                        className="max-w-xs"
                      />
                      <Button type="button" variant="outline" size="sm" className="rounded-full shrink-0" onClick={addCustomRoom} disabled={!newCustomRoom.trim()}>
                        Adicionar
                      </Button>
                    </div>
                  )}
                  {customRoomTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customRoomTypes.map((name) => (
                        <Badge key={name} variant="secondary" className="flex items-center gap-1 pr-1">
                          {name}
                          <button type="button" onClick={() => removeRoomType(name)} className="rounded p-0.5 hover:bg-muted" aria-label="Remover">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                  <div className="mt-4">
                    <Label className="mb-2 block text-sm font-medium">Adicionar outro estilo</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Estilo que não está na lista (ex.: contemporâneo, mediterrâneo).
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Contemporâneo, Mediterrâneo"
                        value={newCustomStyle}
                        onChange={(e) => setNewCustomStyle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomStyle())}
                      />
                      <Button type="button" variant="outline" size="sm" className="rounded-full shrink-0" onClick={addCustomStyle} disabled={!newCustomStyle.trim()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    {customStyles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {customStyles.map((name) => (
                          <Badge key={name} variant="secondary" className="flex items-center gap-1 pr-1">
                            {name}
                            <button type="button" onClick={() => removeCustomStyle(name)} className="rounded p-0.5 hover:bg-muted" aria-label="Remover">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
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
                      selectedRoomTypes.length > 0,
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
