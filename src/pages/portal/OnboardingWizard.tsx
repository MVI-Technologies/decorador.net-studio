import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Sparkles, Home, Bed, ChefHat, Monitor, TreePine, Bath, Users } from "lucide-react";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFirstAccess, type OnboardingDraft } from "@/hooks/useFirstAccess";
import { Emoji } from "@/components/ui/Emoji";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 5;

const roomOptions = [
  { value: "Sala", label: "Sala de estar", icon: Home },
  { value: "Quarto", label: "Quarto", icon: Bed },
  { value: "Cozinha", label: "Cozinha", icon: ChefHat },
  { value: "Escritório", label: "Home Office", icon: Monitor },
  { value: "Área externa", label: "Área externa", icon: TreePine },
  { value: "Banheiro", label: "Banheiro", icon: Bath },
  { value: "Outro", label: "Outro", icon: Users },
];

const styleOptions = [
  { value: "Moderno", emoji: "🏙️" },
  { value: "Minimalista", emoji: "◻️" },
  { value: "Rústico", emoji: "🪵" },
  { value: "Industrial", emoji: "⚙️" },
  { value: "Clássico", emoji: "🏛️" },
  { value: "Boho", emoji: "🌿" },
  { value: "Tropical", emoji: "🌴" },
  { value: "Escandinavo", emoji: "❄️" },
];

const budgetRanges = [
  { value: "3000", label: "Até R$ 3.000", sub: "Básico" },
  { value: "8000", label: "R$ 3.000 – 8.000", sub: "Intermediário" },
  { value: "20000", label: "R$ 8.000 – 20.000", sub: "Avançado" },
  { value: "50000", label: "Acima de R$ 20.000", sub: "Premium" },
];

const priorityOptions = [
  { value: "economico", emoji: "💰", label: "Econômico", desc: "Foco em custo-benefício" },
  { value: "equilibrado", emoji: "⚖️", label: "Equilibrado", desc: "Qualidade com bom preço" },
  { value: "premium", emoji: "✨", label: "Premium", desc: "O melhor, sem compromisso" },
];

const deadlineOptions = [
  { value: "urgente", emoji: "🔥", label: "Urgente", desc: "Menos de 1 mês" },
  { value: "medio", emoji: "📅", label: "1 a 3 meses", desc: "Tranquilo, mas logo" },
  { value: "flexivel", emoji: "😌", label: "Sem pressa", desc: "Quando ficar pronto" },
];

/* ------------------------------------------------------------------ */
/* Microcopy motivacional por passo                                     */
/* ------------------------------------------------------------------ */

const stepMeta = [
  {
    title: "Qual ambiente vamos transformar?",
    sub: "Comece escolhendo o cômodo — personalizamos tudo a partir daí.",
  },
  {
    title: "Que estilos te encantam?",
    sub: "Escolha um ou mais. Usamos isso para encontrar o decorador ideal pra você.",
  },
  {
    title: "Quanto você quer investir?",
    sub: "Não tem certo ou errado. Seja honesto para encontrarmos o match perfeito.",
  },
  {
    title: "Fale um pouco mais sobre o espaço",
    sub: "Só itens rápidos — leva menos de 30 segundos.",
  },
  {
    title: "Qual é o seu prazo?",
    sub: (<>Última pergunta! <Emoji>🎉</Emoji> Depois disso, mostramos quem pode te ajudar.</>),
  },
];

/* ------------------------------------------------------------------ */
/* Main Component                                                       */
/* ------------------------------------------------------------------ */

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markDone, saveProgress, loadProgress } = useFirstAccess();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Form state — loaded from draft on mount
  const [roomType, setRoomType] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState("");
  const [priority, setPriority] = useState("");
  const [roomSize, setRoomSize] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [deadline, setDeadline] = useState("");

  // Load draft on mount
  useEffect(() => {
    const draft = loadProgress();
    if (draft.step) setStep(draft.step);
    if (draft.roomType) setRoomType(draft.roomType);
    if (draft.styles) setStyles(draft.styles);
    if (draft.budgetRange) setBudgetRange(draft.budgetRange);
    if (draft.priority) setPriority(draft.priority);
    if (draft.roomSize) setRoomSize(draft.roomSize ?? "");
    if (draft.hasPets !== undefined) setHasPets(draft.hasPets);
    if (draft.hasChildren !== undefined) setHasChildren(draft.hasChildren);
    if (draft.deadline) setDeadline(draft.deadline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on every state change
  const draft: OnboardingDraft = { step, roomType, styles, budgetRange, priority, roomSize, hasPets, hasChildren, deadline };
  useEffect(() => {
    saveProgress(draft);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, roomType, styles, budgetRange, priority, roomSize, hasPets, hasChildren, deadline]);

  const toggleStyle = (s: string) => {
    setStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const next = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step]);

  const back = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const skip = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else void handleSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const budgetNum = budgetRange ? parseInt(budgetRange, 10) : undefined;
      const res = await api.post("/briefings", {
        projectTitle: `Projeto de ${roomType || "Decoração"} — ${user?.name ?? ""}`.trim(),
        roomType: roomType || undefined,
        roomSize: roomSize || undefined,
        budget: budgetNum,
        stylePreferences: styles,
        requirements: [
          hasPets ? "Tem pets" : null,
          hasChildren ? "Tem crianças" : null,
          priority ? `Prioridade: ${priority}` : null,
          deadline ? `Prazo: ${deadline}` : null,
        ]
          .filter(Boolean)
          .join("; ") || undefined,
        // deadline não é enviado pois o valor do wizard é um rótulo (urgente/medio/flexivel),
        // não uma data ISO. Ele está incluído em `requirements` acima.
      });
      const payload = res.data?.data ?? res.data ?? {};
      const project = payload?.project ?? payload;
      const projectId = project?.id ?? (project as { id?: string })?.id;
      if (!projectId) throw new Error("Projeto sem ID");
      await markDone();
      setCreatedProjectId(projectId);
      setDone(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------------------------------- */
  /* Render                                                     */
  /* --------------------------------------------------------- */

  if (done && createdProjectId) {
    return <SuccessScreen projectId={createdProjectId} />;
  }

  const meta = stepMeta[step - 1];
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Passo {step} de {TOTAL_STEPS}
          </span>
          <button
            type="button"
            onClick={skip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pular
          </button>
        </div>
        {/* Progress bar */}
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {/* Title region */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-display-sm text-foreground">{meta.title}</h1>
          <p className="mt-2 text-muted-foreground">{meta.sub}</p>
        </div>

        {/* Step content */}
        {step === 1 && (
          <StepAmbiente selected={roomType} onSelect={setRoomType} />
        )}
        {step === 2 && (
          <StepEstilos selected={styles} onToggle={toggleStyle} />
        )}
        {step === 3 && (
          <StepOrcamento
            budget={budgetRange}
            priority={priority}
            onBudget={setBudgetRange}
            onPriority={setPriority}
          />
        )}
        {step === 4 && (
          <StepMedidas
            roomSize={roomSize}
            hasPets={hasPets}
            hasChildren={hasChildren}
            onRoomSize={setRoomSize}
            onPets={setHasPets}
            onChildren={setHasChildren}
          />
        )}
        {step === 5 && (
          <StepPrazo selected={deadline} onSelect={setDeadline} />
        )}

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={back} className="gap-2 rounded-full">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <Button onClick={next} className="gap-2 rounded-full shadow-brand px-8" size="lg">
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 rounded-full shadow-brand px-8"
              size="lg"
            >
              {submitting ? "Criando…" : "Concluir briefing"}
              {!submitting && <Sparkles className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

/* ================================================================== */
/* Step Components                                                      */
/* ================================================================== */

function StepAmbiente({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {roomOptions.map(({ value, label, icon: Icon }) => {
        const active = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              "group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-md",
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
              {label}
            </span>
            {active && <Check className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function StepEstilos({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {styleOptions.map(({ value, emoji }) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 transition-all duration-200",
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            {active && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Check className="h-3 w-3 text-primary-foreground" />
              </span>
            )}
            <span className="text-3xl" role="img" aria-label={value}><Emoji>{emoji}</Emoji></span>
            <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StepOrcamento({
  budget,
  priority,
  onBudget,
  onPriority,
}: {
  budget: string;
  priority: string;
  onBudget: (v: string) => void;
  onPriority: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">Faixa de investimento</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {budgetRanges.map(({ value, label, sub }) => {
            const active = budget === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onBudget(value)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all",
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div>
                  <p className={cn("font-semibold", active ? "text-primary" : "text-foreground")}>{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                {active && <Check className="h-5 w-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">Sua prioridade</p>
        <div className="flex flex-col gap-3">
          {priorityOptions.map(({ value, emoji, label, desc }) => {
            const active = priority === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onPriority(value)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all",
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div>
                  <p className={cn("font-semibold", active ? "text-primary" : "text-foreground")}>
                    <Emoji>{emoji}</Emoji> {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {active && <Check className="h-5 w-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepMedidas({
  roomSize,
  hasPets,
  hasChildren,
  onRoomSize,
  onPets,
  onChildren,
}: {
  roomSize: string;
  hasPets: boolean;
  hasChildren: boolean;
  onRoomSize: (v: string) => void;
  onPets: (v: boolean) => void;
  onChildren: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Metragem aproximada (m²)
        </label>
        <input
          type="number"
          min={1}
          placeholder="Ex: 25"
          value={roomSize}
          onChange={(e) => onRoomSize(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-lg font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Restrições</p>

        <ToggleCard
          emoji="🐾"
          label="Tenho pets"
          desc="Iremos priorizar materiais resistentes e fáceis de limpar."
          active={hasPets}
          onToggle={() => onPets(!hasPets)}
        />
        <ToggleCard
          emoji="👶"
          label="Tenho crianças"
          desc="Segurança e praticidade nos detalhes do projeto."
          active={hasChildren}
          onToggle={() => onChildren(!hasChildren)}
        />
      </div>
    </div>
  );
}

function ToggleCard({
  emoji,
  label,
  desc,
  active,
  onToggle,
}: {
  emoji: string;
  label: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all",
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
      )}
    >
      <span className="text-2xl" role="img"><Emoji>{emoji}</Emoji></span>
      <div className="flex-1">
        <p className={cn("font-semibold", active ? "text-primary" : "text-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          active ? "border-primary bg-primary" : "border-border"
        )}
      >
        {active && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
      </div>
    </button>
  );
}

function StepPrazo({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {deadlineOptions.map(({ value, emoji, label, desc }) => {
        const active = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              "flex items-center justify-between rounded-2xl border-2 px-6 py-5 text-left transition-all",
              active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            <div>
              <p className={cn("text-lg font-semibold", active ? "text-primary" : "text-foreground")}>
                <Emoji>{emoji}</Emoji> {label}
              </p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            {active && <Check className="h-5 w-5 shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* Success Screen                                                       */
/* ================================================================== */

function SuccessScreen({ projectId }: { projectId: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Confetti-like illustration */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full gradient-brand shadow-brand">
        <Sparkles className="h-12 w-12 text-white" />
      </div>

      <h1 className="text-display-md text-foreground">Seu briefing está pronto!</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Incrível! Agora é hora de conhecer os decoradores que combinam com o seu projeto.
      </p>

      {/* CTAs */}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          className="rounded-full shadow-brand px-8"
          size="lg"
          onClick={() => navigate(`/app/projetos/${projectId}/match`)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Ver decoradores compatíveis
        </Button>
        <Button
          variant="outline"
          className="rounded-full px-8"
          size="lg"
          onClick={() => navigate(`/app/projetos/${projectId}`)}
        >
          Ver meu projeto
        </Button>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => navigate(`/app/projetos/${projectId}/editar-briefing`)}
        >
          Ajustar briefing
        </Button>
      </div>

      {/* Skip to dashboard */}
      <button
        type="button"
        className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => navigate("/app")}
      >
        Ir ao dashboard →
      </button>
    </div>
  );
}
