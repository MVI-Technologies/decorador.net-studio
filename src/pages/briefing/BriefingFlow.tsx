import { useState, useReducer, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth, getApiErrorMessage } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Heart,
  Upload,
  Camera,
  Ruler,
  MapPin,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Home,
  Frown,
  DollarSign,
} from "lucide-react";
import "./briefing-flow.css";

/* ================================================================== */
/* State management                                                     */
/* ================================================================== */

const STEPS_COMPLETO = 8;
const STEPS_CONSULTORIA = 7;

export type BriefingMode = "completo" | "consultoria";

function storageKey(mode: BriefingMode) {
  return `decorador-briefing-${mode}`;
}

export interface BriefingState {
  step: number;
  // Quiz
  quizPicks: number[];
  detectedStyle: string;
  chosenStyles: string[];
  // Personal
  name: string;
  whatsapp: string;
  city: string;
  state: string;
  bairro: string;
  // Projeto completo
  intentions: string[];
  // Environment
  roomSize: string;
  plantFiles: File[];
  photoFiles: File[];
  // Deadline
  deadline: string;
  // Consultoria
  roomType: string;
  residents: string;
  hasPets: boolean;
  hasChildren: boolean;
  painPoints: string[];
  priorities: string;
  budgetRange: string;
  keepItems: string;
}

type Action =
  | { type: "SET_STEP"; step: number }
  | { type: "QUIZ_PICK"; idx: number }
  | { type: "SET_DETECTED_STYLE"; style: string }
  | { type: "SET_CHOSEN_STYLES"; styles: string[] }
  | { type: "TOGGLE_STYLE"; style: string }
  | { type: "SET_FIELD"; field: keyof BriefingState; value: string | string[] | boolean | number | File[] }
  | { type: "TOGGLE_INTENTION"; intention: string }
  | { type: "TOGGLE_PAIN"; intention: string }
  | { type: "LOAD"; state: Partial<BriefingState> };

const initialState: BriefingState = {
  step: 1,
  quizPicks: [],
  detectedStyle: "",
  chosenStyles: [],
  name: "",
  whatsapp: "",
  city: "",
  state: "",
  bairro: "",
  intentions: [],
  roomSize: "",
  plantFiles: [],
  photoFiles: [],
  deadline: "",
  roomType: "",
  residents: "",
  hasPets: false,
  hasChildren: false,
  painPoints: [],
  priorities: "",
  budgetRange: "",
  keepItems: "",
};

function reducer(state: BriefingState, action: Action): BriefingState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "QUIZ_PICK": {
      const already = state.quizPicks.includes(action.idx);
      return {
        ...state,
        quizPicks: already
          ? state.quizPicks.filter((i) => i !== action.idx)
          : [...state.quizPicks, action.idx],
      };
    }
    case "SET_DETECTED_STYLE":
      return { ...state, detectedStyle: action.style };
    case "SET_CHOSEN_STYLES":
      return { ...state, chosenStyles: action.styles };
    case "TOGGLE_STYLE": {
      const has = state.chosenStyles.includes(action.style);
      return {
        ...state,
        chosenStyles: has
          ? state.chosenStyles.filter((s) => s !== action.style)
          : [...state.chosenStyles, action.style],
      };
    }
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "TOGGLE_PAIN": {
      const has = state.painPoints.includes(action.intention);
      return {
        ...state,
        painPoints: has
          ? state.painPoints.filter((i) => i !== action.intention)
          : [...state.painPoints, action.intention],
      };
    }
    case "TOGGLE_INTENTION": {
      const has = state.intentions.includes(action.intention);
      return {
        ...state,
        intentions: has
          ? state.intentions.filter((i) => i !== action.intention)
          : [...state.intentions, action.intention],
      };
    }
    case "LOAD":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

/* ================================================================== */
/* Data                                                                 */
/* ================================================================== */

interface QuizImage {
  src: string;
  style: string;
  label: string;
}

const quizImages: QuizImage[] = [
  // Moderno (2)
  { src: "https://i0.wp.com/pachecos.com/wp-content/uploads/2025/05/1.jpg?fit=2000%2C1500&ssl=1", style: "Moderno", label: "Sala moderna e clean" },
  { src: "https://finger.ind.br/wp-content/uploads/2020/12/quando-investir-em-uma-cozinha-integrada-2-scaled.jpg", style: "Moderno", label: "Cozinha moderna integrada" },
  // Minimalista (2)
  { src: "https://finger.ind.br/wp-content/uploads/2024/06/7-dicas-de-decoracao-para-um-quarto-minimalista-1024x683.jpg", style: "Minimalista", label: "Quarto moderno minimalista" },
  { src: "https://balancethroughsimplicity.com/wp-content/uploads/2023/04/Minimalist-Workspace.jpg", style: "Minimalista", label: "Workspace minimalista zen" },
  // Rústico (2)
  { src: "https://blog.archtrends.com/wp-content/uploads/2020/01/30151931/cozinha-ru%CC%81stica-portobello.jpg", style: "Rústico", label: "Cozinha rústica charmosa" },
  { src: "https://amaisd.com.br/wp-content/themes/theme/blog_images/varanda_26.jpg", style: "Rústico", label: "Varanda rústica acolhedora" },
  // Industrial (2)
  { src: "https://midias.jornalcruzeiro.com.br/wp-content/uploads/2019/04/Lofts-contempor%C3%A2neos-3.jpg", style: "Industrial", label: "Loft industrial" },
  { src: "https://ladytex.com.br/wp-content/uploads/2024/01/Escritorio-com-arquitetura-industrial-entenda-mais-sobre-essa-tendencia-5.jpg", style: "Industrial", label: "Escritório industrial" },
  // Clássico (2)
  { src: "https://cdnm.westwing.com.br/glossary/uploads/br/2015/10/13022805/Mesa-de-Jantar-Cl%C3%A1ssica-branca-com-poltronas-p%C3%A9-de-palito-fonte-unsplash-c-a4052.jpg", style: "Clássico", label: "Sala de jantar clássica" },
  { src: "https://italicohomes.com/wp-content/uploads/2025/03/living-room-luxuoso-transforme-sua-casa-classica-com-estilo-neoclassico-1.jpg", style: "Clássico", label: "Living elegante clássico" },
  // Boho (3)
  { src: "https://landmarksarchitects.com/wp-content/uploads/2024/10/modern-bohemian-interior-livingroom1032024.jpg", style: "Boho", label: "Living boho vibrante" },
  { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcR2jn9ES0K3yHM14xgCV26L6LAz1m5LNFIQ&s", style: "Boho", label: "Quarto boho aconchegante" },
  { src: "https://cdnm.westwing.com.br/glossary/uploads/br/2023/04/15205743/Decoracao-boho-com-projeto-Westwing-Design.-Fonte-Westwing-1.jpg", style: "Boho", label: "Cantinho boho criativo" },
  // Escandinavo (2)
  { src: "https://thumbs.dreamstime.com/b/sala-de-estar-e-jantar-escandinavos-brilhantes-estilosos-escandinava-estilosa-com-molho-menta-design-maconha-cartaz-mapear-plantas-176793134.jpg", style: "Escandinavo", label: "Sala escandinava luminosa" },
  { src: "https://thumbs.dreamstime.com/b/modelo-do-quarto-escandinavo-estilo-bedroom-com-sotaque-aconchegante-de-madeira-leve-e-arte-estilosa-parede-um-len%C3%A7%C3%B3is-bege-346448177.jpg", style: "Escandinavo", label: "Quarto escandinavo clean" },
  // Tropical (2)
  { src: "https://cdnm.westwing.com.br/glossary/uploads/br/2015/06/18055038/Sala-com-decora%C3%A7%C3%A3o-Tropical-sof%C3%A1-verde-almofadas-com-estampa-de-folhas-vasos-com-plantas-e-cortina-estampada-com-folhas-pinterest-c-a8033.jpg", style: "Tropical", label: "Sala tropical relaxante" },
  { src: "https://images.ctfassets.net/qfxflpv0atz9/3x6xQT7vDzDtm1ZKnN2aUv/0b8490c241952febfeb7a314056d8ac0/20210429104342-blog_VarandaTropical_header.png", style: "Tropical", label: "Varanda tropical vibrante" },
  // Contemporâneo (2)
  { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", style: "Contemporâneo", label: "Casa contemporânea sofisticada" },
  { src: "https://finger.ind.br/wp-content/uploads/2023/09/cozinha-elegante-como-criar-um-ambiente-sofisticado-4-1024x683.jpg", style: "Contemporâneo", label: "Cozinha contemporânea elegante" },
];

const QUIZ_BATCH_SIZE = 6;

const allStyles = [
  { value: "Moderno", emoji: "🏙️" },
  { value: "Minimalista", emoji: "◻️" },
  { value: "Rústico", emoji: "🪵" },
  { value: "Industrial", emoji: "⚙️" },
  { value: "Clássico", emoji: "🏛️" },
  { value: "Boho", emoji: "🌿" },
  { value: "Tropical", emoji: "🌴" },
  { value: "Escandinavo", emoji: "❄️" },
];

const intentionCards = [
  { id: "deco-sem-obra", label: "Quero projeto de decoração sem obra", icon: "🎨", big: true },
  { id: "repaginada", label: "Não quero investir muito, só dar uma repaginada", icon: "✨", big: true },
  { id: "revestimentos", label: "Quero troca ou sugestão de revestimentos", icon: "🧱", big: false },
  { id: "preservar-rev", label: "Quero preservar revestimentos atuais", icon: "🛡️", big: false },
  { id: "aproveitar-moveis", label: "Vou aproveitar móveis que já tenho", icon: "🛋️", big: false },
  { id: "objetos-deco", label: "Quero indicações de objetos de decoração", icon: "🖼️", big: false },
];

const sideFeatures = [
  "Obra (demolir / alterar / construir paredes)",
  "Marcenaria (detalhamento de móveis sob medida)",
  "Iluminação / forro de gesso",
  "Alternativa: sem projeto de iluminação (poucos pontos)",
  "Pontos elétricos (tomadas / interruptores)",
  "Pontos hidráulicos",
];

const deadlineCards = [
  { value: "7", label: "7 dias", emoji: "🚀", desc: "Super express!", className: "bf-deadline-rocket" },
  { value: "15", label: "15 dias", emoji: "🙂", desc: "Prazo tranquilo", className: "bf-deadline-smile" },
  { value: "30", label: "30 dias", emoji: "🧘", desc: "Sem pressa, mas com prazo", className: "bf-deadline-zen" },
];

const brStates = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

/* ================================================================== */
/* Main Component                                                       */
/* ================================================================== */

export default function BriefingFlow({
  mode = "completo",
  initialData,
  editProjectId,
}: {
  mode?: BriefingMode;
  initialData?: Partial<BriefingState>;
  editProjectId?: string;
}) {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialData ? { ...initialState, ...initialData } : initialState);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  // draftPrompt: null=no draft; number=draft step found. Skip entirely when editing existing.
  const [draftPrompt, setDraftPrompt] = useState<number | null>(null);
  const isEditing = !!editProjectId;
  const TOTAL_STEPS = mode === "completo" ? STEPS_COMPLETO : STEPS_CONSULTORIA;
  const SKEY = storageKey(mode);

  // Load draft from localStorage — only show prompt, don't auto-load.
  // Skip entirely when editing an existing project (initialData provided).
  useEffect(() => {
    if (isEditing) return; // pre-filled from project data — no draft
    try {
      const saved = localStorage.getItem(SKEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.step && parsed.step > 1) {
          // Prompt user: continue or start fresh
          setDraftPrompt(parsed.step as number);
        } else {
          // step === 1 is fine to auto-load silently
          delete parsed.plantFiles;
          delete parsed.photoFiles;
          dispatch({ type: "LOAD", state: parsed });
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SKEY]);

  // Save draft on change (excluding files)
  useEffect(() => {
    if (draftPrompt !== null) return; // Don't overwrite while prompt is showing
    const { plantFiles, photoFiles, ...saveable } = state;
    void plantFiles; void photoFiles;
    localStorage.setItem(SKEY, JSON.stringify(saveable));
  }, [state, SKEY, draftPrompt]);

  const resetToFresh = useCallback(() => {
    localStorage.removeItem(SKEY);
    dispatch({ type: "LOAD", state: { ...initialState } });
    setDraftPrompt(null);
  }, [SKEY]);

  const resumeDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(SKEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.plantFiles;
        delete parsed.photoFiles;
        dispatch({ type: "LOAD", state: parsed });
      }
    } catch { /* ignore */ }
    setDraftPrompt(null);
  }, [SKEY]);

  const progress = (state.step / TOTAL_STEPS) * 100;

  const next = useCallback(() => {
    if (state.step < TOTAL_STEPS) dispatch({ type: "SET_STEP", step: state.step + 1 });
  }, [state.step]);

  const back = useCallback(() => {
    if (state.step > 1) {
      if (state.step === 2) {
        // Reset the quiz so the user can redo it on step 1
        dispatch({ type: "LOAD", state: { quizPicks: [], detectedStyle: "", chosenStyles: [] } });
      }
      dispatch({ type: "SET_STEP", step: state.step - 1 });
    }
  }, [state.step]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const isConsultoria = mode === "consultoria";
      const title = isConsultoria
        ? `Consultoria — ${state.name || user?.name || "Decoração"}`.trim()
        : `Projeto Completo — ${state.name || user?.name || "Decoração"}`.trim();
      const reqs = isConsultoria
        ? [
            state.painPoints.length ? `Problemas: ${state.painPoints.join("; ")}` : null,
            state.priorities ? `Prioridades: ${state.priorities}` : null,
            state.residents ? `Moradores: ${state.residents}` : null,
            state.hasPets ? "Tem pets" : null,
            state.hasChildren ? "Tem crianças" : null,
            state.budgetRange ? `Orçamento: ${state.budgetRange}` : null,
            state.keepItems ? `Manter: ${state.keepItems}` : null,
            state.deadline ? `Prazo: ${state.deadline} dias` : "Prazo: pendente de decisão",
          ]
        : [
            state.intentions.length ? `Intenções: ${state.intentions.join("; ")}` : null,
            state.bairro ? `Bairro: ${state.bairro}` : null,
            state.city ? `Cidade: ${state.city}` : null,
            state.state ? `Estado: ${state.state}` : null,
            state.deadline ? `Prazo: ${state.deadline} dias` : "Prazo: pendente de decisão",
          ];
      const body = {
        projectTitle: title,
        roomType: isConsultoria ? (state.roomType || "Ambiente Integrado") : "Ambiente Integrado",
        roomSize: state.roomSize || undefined,
        stylePreferences: state.chosenStyles.length ? state.chosenStyles : [state.detectedStyle].filter(Boolean),
        requirements: reqs.filter(Boolean).join("; ") || undefined,
      };

      if (isEditing) {
        // PATCH existing briefing
        await api.patch(`/briefings/${editProjectId}`, body);
        localStorage.removeItem(SKEY);
        toast.success("Briefing atualizado! 🎉");
        navigate(`/app/projetos/${editProjectId}`);
        return;
      }

      const res = await api.post("/briefings", body);
      const payload = res.data?.data ?? res.data ?? {};
      const project = payload?.project ?? payload;
      const projectId = project?.id;
      if (!projectId) throw new Error("Projeto sem ID");
      localStorage.removeItem(SKEY);
      setCreatedProjectId(projectId);
      setDone(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [mode, state, user, SKEY, isEditing, editProjectId, navigate]);

  if (done && createdProjectId) {
    return <SuccessScreen projectId={createdProjectId} mode={mode} />;
  }

  // Draft continuation prompt
  if (draftPrompt !== null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-card p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">📋</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Você tem um rascunho! 🙂</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Estava no passo <span className="font-semibold text-primary">{draftPrompt}</span> de {TOTAL_STEPS}. Quer continuar ou começar do zero?
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={resumeDraft}
              className="w-full rounded-full bf-btn-green text-white hover:text-white"
              size="lg"
            >
              Continuar de onde parei 🚀
            </Button>
            <Button
              variant="outline"
              onClick={resetToFresh}
              className="w-full rounded-full"
              size="lg"
            >
              Começar do zero
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 px-6 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              Passo {state.step} de {TOTAL_STEPS} ✨
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}% completo
            </span>
          </div>
          <div className="bf-progress-track">
            <div className="bf-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-8">
        <div key={state.step} className="bf-step-enter">
          {/* SHARED: Steps 1-2 (quiz) */}
          {state.step === 1 && (
            <StepQuiz
              picks={state.quizPicks}
              onPick={(idx) => {
                const isUnpick = state.quizPicks.includes(idx);
                dispatch({ type: "QUIZ_PICK", idx });
                if (!isUnpick && state.quizPicks.length + 1 >= 5) {
                  const allPicks = [...state.quizPicks, idx];
                  const counts: Record<string, number> = {};
                  allPicks.forEach((i) => {
                    const s = quizImages[i]?.style;
                    if (s) counts[s] = (counts[s] || 0) + 1;
                  });
                  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                  dispatch({ type: "SET_DETECTED_STYLE", style: top?.[0] || "Moderno" });
                  dispatch({ type: "SET_CHOSEN_STYLES", styles: [top?.[0] || "Moderno"] });
                  setTimeout(() => dispatch({ type: "SET_STEP", step: 2 }), 600);
                }
              }}
            />
          )}
          {state.step === 2 && (
            <StepResult
              detected={state.detectedStyle}
              chosen={state.chosenStyles}
              onToggle={(s) => dispatch({ type: "TOGGLE_STYLE", style: s })}
              onContinue={next}
            />
          )}

          {/* PROJETO COMPLETO: Steps 3-8 */}
          {mode === "completo" && (
            <>
              {state.step === 3 && (
                <StepPersonal
                  name={state.name}
                  whatsapp={state.whatsapp}
                  city={state.city}
                  stateVal={state.state}
                  bairro={state.bairro}
                  onChange={(field, val) => dispatch({ type: "SET_FIELD", field: field as keyof BriefingState, value: val })}
                  onContinue={next}
                />
              )}
              {state.step === 4 && <StepCheckpoint onContinue={next} />}
              {state.step === 5 && (
                <StepProjetoCompleto
                  intentions={state.intentions}
                  onToggle={(i) => dispatch({ type: "TOGGLE_INTENTION", intention: i })}
                  sideOpen={sideOpen}
                  onSideToggle={() => setSideOpen((v) => !v)}
                  onContinue={next}
                />
              )}
              {state.step === 6 && (
                <StepEnvironment
                  roomSize={state.roomSize}
                  onRoomSize={(v) => dispatch({ type: "SET_FIELD", field: "roomSize", value: v })}
                  onContinue={next}
                />
              )}
              {state.step === 7 && (
                <StepDeadline
                  selected={state.deadline}
                  onSelect={(v) => dispatch({ type: "SET_FIELD", field: "deadline", value: v })}
                  onContinue={next}
                />
              )}
              {state.step === 8 && (
                <StepSubmit isLoggedIn={!!user} submitting={submitting} onSubmit={handleSubmit} />
              )}
            </>
          )}

          {/* CONSULTORIA: Steps 3-7 */}
          {mode === "consultoria" && (
            <>
              {state.step === 3 && (
                <StepConsultoriaSpace
                  roomType={state.roomType}
                  residents={state.residents}
                  hasPets={state.hasPets}
                  hasChildren={state.hasChildren}
                  onChange={(field, val) => dispatch({ type: "SET_FIELD", field: field as keyof BriefingState, value: val })}
                />
              )}
              {state.step === 4 && (
                <StepConsultoriaPains
                  painPoints={state.painPoints}
                  priorities={state.priorities}
                  onTogglePain={(p) => dispatch({ type: "TOGGLE_PAIN", intention: p })}
                  onPriorities={(v) => dispatch({ type: "SET_FIELD", field: "priorities", value: v })}
                />
              )}
              {state.step === 5 && (
                <StepEnvironment
                  roomSize={state.roomSize}
                  onRoomSize={(v) => dispatch({ type: "SET_FIELD", field: "roomSize", value: v })}
                  onContinue={next}
                />
              )}
              {state.step === 6 && (
                <StepConsultoriaBudget
                  budgetRange={state.budgetRange}
                  keepItems={state.keepItems}
                  deadline={state.deadline}
                  onBudget={(v) => dispatch({ type: "SET_FIELD", field: "budgetRange", value: v })}
                  onKeep={(v) => dispatch({ type: "SET_FIELD", field: "keepItems", value: v })}
                  onDeadline={(v) => dispatch({ type: "SET_FIELD", field: "deadline", value: v })}
                />
              )}
              {state.step === 7 && (
                <StepSubmit isLoggedIn={!!user} submitting={submitting} onSubmit={handleSubmit} />
              )}
            </>
          )}
        </div>

        {/* Navigation (except quiz / checkpoint which auto-advance) */}
        {!(state.step === 1 || (state.step === 4 && mode === "completo")) && (
          <div className="mt-10 flex items-center justify-between">
            {state.step > 1 ? (
              <Button variant="ghost" onClick={back} className="gap-2 rounded-full bf-btn-blue text-white hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            ) : (
              <div />
            )}
            {state.step < TOTAL_STEPS && state.step !== 2 && (
              <Button
                onClick={next}
                className="gap-2 rounded-full px-8 bf-btn-green text-white hover:text-white"
                size="lg"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ================================================================== */
/* Step 1: Style Quiz                                                    */
/* ================================================================== */

function StepQuiz({
  picks,
  onPick,
}: {
  picks: number[];
  onPick: (idx: number) => void;
}) {
  const remaining = 5 - picks.length;
  const [justPicked, setJustPicked] = useState<number | null>(null);

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
        Descubra seu estilo ✨
      </h1>
      <p className="text-muted-foreground mb-1">
        Clique nas imagens que mais te atraem — rápido, como instinto! 🙂
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        {remaining > 0
          ? `Faltam ${remaining} escolha${remaining > 1 ? "s" : ""} 🎯`
          : "Prontíssimo! Calculando seu estilo… ✨"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizImages.map((img, idx) => {
          const chosen = picks.includes(idx);
          const isJust = justPicked === idx;
          return (
            <button
              key={idx}
              type="button"
              disabled={!chosen && remaining <= 0}
              onClick={() => {
                if (!chosen) setJustPicked(idx);
                onPick(idx);
              }}
              className={cn(
                "bf-quiz-card relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2",
                chosen ? "bf-quiz-card--chosen border-primary/50 opacity-60" : "border-border",
                isJust && "bf-quiz-card--chosen",
                !chosen && remaining > 0 && "hover:border-primary/60"
              )}
            >
              <img
                src={img.src}
                alt={img.label}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                <p className="text-left text-sm font-medium text-white">{img.label}</p>
              </div>
              {chosen && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-brand bf-confetti">
                    <Heart className="h-7 w-7 fill-white text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Step 2: Quiz Result                                                   */
/* ================================================================== */

function StepResult({
  detected,
  chosen,
  onToggle,
  onContinue,
}: {
  detected: string;
  chosen: string[];
  onToggle: (style: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full gradient-brand shadow-brand mb-6 bf-confetti">
        <Sparkles className="h-10 w-10 text-white" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
        Seu estilo é <span className="text-gradient-brand">{detected}</span> ✨
      </h1>
      <p className="text-muted-foreground mb-8">
        Baseado nas suas escolhas, esse é o estilo que mais combina com você! Mas você pode ajustar abaixo 🙂
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
        {allStyles.map(({ value, emoji }) => {
          const active = chosen.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={cn(
                "bf-card relative flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-4 transition-all",
                active ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              )}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              )}
              <span className="text-3xl">{emoji}</span>
              <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
                {value}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        onClick={onContinue}
        className="rounded-full px-10 bf-btn-green text-white hover:text-white"
        size="lg"
      >
        Continuar <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

/* ================================================================== */
/* Step 3: Personal Info                                                 */
/* ================================================================== */

function StepPersonal({
  name,
  whatsapp,
  city,
  stateVal,
  bairro,
  onChange,
  onContinue,
}: {
  name: string;
  whatsapp: string;
  city: string;
  stateVal: string;
  bairro: string;
  onChange: (field: string, val: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Prazer em te conhecer! 🙂
      </h1>
      <p className="text-muted-foreground mb-8">
        Pra gente encontrar os melhores decoradores perto de você ✨
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Seu nome
          </label>
          <Input
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Como prefere ser chamado?"
            className="rounded-xl h-12"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            WhatsApp
          </label>
          <Input
            value={whatsapp}
            onChange={(e) => onChange("whatsapp", e.target.value)}
            placeholder="(11) 99999-0000"
            className="rounded-xl h-12"
            type="tel"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Cidade
            </label>
            <Input
              value={city}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="São Paulo"
              className="rounded-xl h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Estado
            </label>
            <select
              value={stateVal}
              onChange={(e) => onChange("state", e.target.value)}
              className="w-full h-12 rounded-xl border border-border bg-card px-3 text-foreground"
            >
              <option value="">Selecione</option>
              {brStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Bairro{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={bairro}
            onChange={(e) => onChange("bairro", e.target.value)}
            placeholder="Jardins, Pinheiros, etc"
            className="rounded-xl h-12"
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Step 4: Checkpoint                                                    */
/* ================================================================== */

function StepCheckpoint({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="bf-checkpoint rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
      <div className="bf-checkpoint-overlay rounded-2xl" style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 100%)"
      }} />
      <div className="relative z-10 flex flex-col items-center text-center px-8 py-16">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full gradient-brand shadow-brand bf-confetti">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Boa! Metade do caminho 🎉
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mb-2">
          Agora conta pra gente o que você quer mudar no seu espaço 🙂
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Falta pouco! Vamos personalizar de verdade ✨
        </p>
        <Button
          onClick={onContinue}
          className="rounded-full px-12 bf-btn-green text-white hover:text-white"
          size="lg"
        >
          Bora! 🚀
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Step 5: Projeto Completo                                              */
/* ================================================================== */

function StepProjetoCompleto({
  intentions,
  onToggle,
  sideOpen,
  onSideToggle,
  onContinue,
}: {
  intentions: string[];
  onToggle: (i: string) => void;
  sideOpen: boolean;
  onSideToggle: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Ambiente 1 — Ambiente Integrado
            </span>
            <button
              type="button"
              className="ml-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="h-3 w-3" /> Adicionar ambiente — quanto mais, mais barato 🙂
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          O que você quer para seu ambiente 🎨
        </h1>
        <p className="text-muted-foreground mb-6">
          Selecione tudo que faz sentido pra você ✨
        </p>

        {/* Big cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {intentionCards.filter((c) => c.big).map((card) => {
            const active = intentions.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onToggle(card.id)}
                className={cn(
                  "bf-card flex items-center gap-4 rounded-2xl border-2 p-5 text-left",
                  active ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                )}
              >
              <span className="text-3xl shrink-0">{card.icon}</span>
                <span className={cn("font-semibold text-sm flex-1 min-w-0", active ? "text-primary" : "text-foreground")}>
                  {card.label}
                </span>
                <span className="shrink-0 ml-2">
                  <ToggleSwitch active={active} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {intentionCards.filter((c) => !c.big).map((card) => {
            const active = intentions.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onToggle(card.id)}
                className={cn(
                  "bf-card flex items-center gap-3 rounded-2xl border-2 p-4 text-left",
                  active ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                )}
              >
              <span className="text-xl shrink-0">{card.icon}</span>
                <span className={cn("font-medium text-xs flex-1 min-w-0", active ? "text-primary" : "text-foreground")}>
                  {card.label}
                </span>
                <span className="shrink-0 ml-2">
                  <ToggleSwitch active={active} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel — desktop: fixed, mobile: accordion */}
      <div className="lg:w-80 shrink-0">
        {/* Mobile accordion */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={onSideToggle}
            className="w-full flex items-center justify-between rounded-2xl gradient-brand px-5 py-4 text-white font-semibold"
          >
            <span>Projeto Completo — o que inclui</span>
            {sideOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {sideOpen && (
            <div className="mt-2 rounded-2xl gradient-brand px-5 py-4 text-white/90">
              <SidePanelContent />
            </div>
          )}
        </div>

        {/* Desktop fixed panel */}
        <div className="hidden lg:block bf-side-panel sticky top-24">
          <h3 className="text-xl font-bold mb-1">Projeto Completo</h3>
          <p className="text-white/70 text-sm mb-4">O que está incluso ✨</p>
          <SidePanelContent />
        </div>
      </div>
    </div>
  );
}

function SidePanelContent() {
  return (
    <ul className="space-y-3 text-sm">
      {sideFeatures.map((f, i) => (
        <li key={i} className="flex items-start gap-2">
          <Check className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <div className={cn("bf-toggle-track", active && "bf-toggle-track--on")}>
      <div className="bf-toggle-knob" />
    </div>
  );
}

/* ================================================================== */
/* Step 6: Environment Details                                           */
/* ================================================================== */

function StepEnvironment({
  roomSize,
  onRoomSize,
  onContinue,
}: {
  roomSize: string;
  onRoomSize: (v: string) => void;
  onContinue: () => void;
}) {
  const plantRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [plantCount, setPlantCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Detalhes do ambiente 📐
      </h1>
      <p className="text-muted-foreground mb-8">
        Quanto mais detalhes, melhor o projeto! 🙂
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Metragem */}
        <div className="rounded-2xl border-2 border-border bg-card p-6 flex flex-col items-center text-center">
          <Ruler className="h-8 w-8 text-primary mb-3" />
          <span className="text-sm font-semibold text-foreground mb-2">Metragem</span>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              min={1}
              max={999}
              value={roomSize}
              onChange={(e) => onRoomSize(e.target.value)}
              placeholder="25"
              className="w-20 text-center text-4xl font-bold text-primary bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none transition-colors"
            />
            <span className="text-lg text-muted-foreground">m²</span>
          </div>
        </div>

        {/* Planta */}
        <div
          className="bf-upload-zone flex flex-col items-center justify-center gap-2"
          onClick={() => plantRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Planta do ambiente
          </span>
          <span className="text-xs text-muted-foreground">
            {plantCount > 0 ? `${plantCount} arquivo(s) ✓` : "Clique ou arraste 📁"}
          </span>
          <input
            ref={plantRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) setPlantCount(e.target.files.length);
            }}
          />
        </div>
      </div>

      {/* Fotos */}
      <div
        className="bf-upload-zone flex flex-col items-center justify-center gap-2"
        onClick={() => photoRef.current?.click()}
      >
        <Camera className="h-8 w-8 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          Insira 3 ou mais fotos do ambiente atual 📸
        </span>
        <span className="text-xs text-muted-foreground">
          {photoCount > 0
            ? `${photoCount} foto(s) selecionada(s) ✓`
            : "Isso ajuda o decorador a entender melhor o espaço 🙂"}
        </span>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) setPhotoCount(e.target.files.length);
          }}
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/* Step 7: Deadline Picker                                               */
/* ================================================================== */

function StepDeadline({
  selected,
  onSelect,
  onContinue,
}: {
  selected: string;
  onSelect: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Prazo do projeto ⏰
      </h1>
      <p className="text-muted-foreground mb-8">
        Sem pressa, mas a gente precisa combinar um prazo 🙂
      </p>

      <div className="flex flex-col gap-4">
        {deadlineCards.map(({ value, label, emoji, desc, className: dcn }) => {
          const active = selected === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={cn(
                "bf-card flex items-center gap-5 rounded-2xl border-2 px-6 py-6 text-left",
                dcn,
                active && "bf-card--active"
              )}
            >
              <span className="text-4xl shrink-0">{emoji}</span>
              <div className="flex-1">
                <p className="text-xl font-bold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              {active && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary bf-confetti">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-center text-muted-foreground">
        ⚠️ O prazo máximo é de 30 dias após o início do projeto.
      </p>
    </div>
  );
}

/* ================================================================== */
/* Step 8: Submit / Signup                                                */
/* ================================================================== */

function StepSubmit({
  isLoggedIn,
  submitting,
  onSubmit,
}: {
  isLoggedIn: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { signupAndLogin, login } = useAuth();
  const [mode2, setMode2] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [localLoading, setLocalLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleAuth = async () => {
    setErr("");
    if (!form.email || !form.password) { setErr("Preencha e-mail e senha."); return; }
    setLocalLoading(true);
    try {
      if (mode2 === "signup") {
        if (!form.name) { setErr("Preencha seu nome."); setLocalLoading(false); return; }
        await signupAndLogin({ name: form.name, email: form.email, password: form.password });
      } else {
        await login(form.email, form.password);
      }
      // Now authenticated — submit briefing immediately
      onSubmit();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || "Erro ao autenticar";
      setErr(msg);
    } finally {
      setLocalLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full gradient-brand shadow-brand bf-confetti">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Quase lá! 🎉</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          {mode2 === "signup"
            ? "Cria uma conta rápida pra salvar o briefing e receber as propostas 🙂"
            : "Entre na sua conta para salvar o briefing 🙂"}
        </p>

        <div className="space-y-3 mb-4">
          {mode2 === "signup" && (
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Seu nome"
              className="rounded-xl h-12"
            />
          )}
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="E-mail"
            className="rounded-xl h-12"
          />
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Senha"
            className="rounded-xl h-12"
          />
          {err && <p className="text-sm text-red-500">{err}</p>}
        </div>

        <Button
          onClick={handleAuth}
          disabled={localLoading || submitting}
          className="w-full rounded-full bf-btn-green text-white hover:text-white"
          size="lg"
        >
          {localLoading || submitting
            ? "Salvando… ✨"
            : mode2 === "signup" ? "Criar conta e salvar briefing ✨" : "Entrar e salvar briefing 🚀"}
        </Button>

        <button
          type="button"
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => { setMode2(mode2 === "signup" ? "login" : "signup"); setErr(""); }}
        >
          {mode2 === "signup" ? "Já tenho conta — entrar" : "Criar conta nova"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full gradient-brand shadow-brand bf-confetti">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">Tudo pronto! 🎉</h1>
      <p className="text-muted-foreground mb-8">
        Seu briefing completo está aqui. Clique para enviar e encontrar os melhores decoradores ✨
      </p>
      <Button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full rounded-full shadow-brand px-10"
        size="lg"
      >
        {submitting ? "Enviando… ✨" : "Enviar briefing e ver decoradores 🚀"}
      </Button>
    </div>
  );
}

/* ================================================================== */
/* Success Screen                                                        */
/* ================================================================== */

function SuccessScreen({ projectId, mode }: { projectId: string; mode: BriefingMode }) {
  const navigate = useNavigate();
  const isConsultoria = mode === "consultoria";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full gradient-brand shadow-brand bf-confetti">
        <Sparkles className="h-12 w-12 text-white" />
      </div>

      <h1 className="text-4xl font-bold text-foreground">
        {isConsultoria ? "Pronto! 🎉" : "Briefing enviado! 🎉"}
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        {isConsultoria
          ? "Agora vamos encontrar alguém perfeito pra você 🙂✨"
          : "Agora é hora de conhecer os decoradores que combinam com o seu projeto ✨"}
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          className="rounded-full shadow-brand px-8 bf-btn-green text-white hover:text-white"
          size="lg"
          onClick={() => navigate(`/app/projetos/${projectId}/match`)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isConsultoria ? "Ver profissionais compatíveis 🚀" : "Ver decoradores compatíveis 🚀"}
        </Button>
        <Button
          variant="outline"
          className="rounded-full px-8"
          size="lg"
          onClick={() => navigate(`/app/projetos/${projectId}`)}
        >
          Ver meu projeto
        </Button>
      </div>

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

/* ================================================================== */
/* Consultoria Step 3: Sobre o espaço                                   */
/* ================================================================== */

const consultoriaRoomTypes = [
  { value: "Sala", emoji: "🛋️" },
  { value: "Quarto", emoji: "🛏️" },
  { value: "Cozinha", emoji: "🍳" },
  { value: "Banheiro", emoji: "🚿" },
  { value: "Escritório", emoji: "💻" },
  { value: "Área externa", emoji: "🌿" },
  { value: "Apartamento inteiro", emoji: "🏠" },
  { value: "Outro", emoji: "✨" },
];

function StepConsultoriaSpace({
  roomType,
  residents,
  hasPets,
  hasChildren,
  onChange,
}: {
  roomType: string;
  residents: string;
  hasPets: boolean;
  hasChildren: boolean;
  onChange: (field: string, val: string | boolean) => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Sobre o seu espaço 🏠
      </h1>
      <p className="text-muted-foreground mb-6">
        Conta pra gente: o que vamos transformar? ✨
      </p>

      <p className="text-sm font-semibold text-foreground mb-3">Tipo de ambiente</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {consultoriaRoomTypes.map(({ value, emoji }) => {
          const active = roomType === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange("roomType", value)}
              className={cn(
                "bf-card flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                active ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-2xl">{emoji}</span>
              <span className={cn("text-xs font-medium", active ? "text-primary" : "text-foreground")}>{value}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Quem mora no espaço?</label>
          <Input
            value={residents}
            onChange={(e) => onChange("residents", e.target.value)}
            placeholder="Ex: casal + 1 filho"
            className="rounded-xl h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange("hasPets", !hasPets)}
            className={cn(
              "bf-card flex items-center gap-3 rounded-2xl border-2 p-4",
              hasPets ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card"
            )}
          >
            <span className="text-2xl">🐾</span>
            <span className={cn("text-sm font-medium", hasPets ? "text-primary" : "text-foreground")}>Tenho pets</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("hasChildren", !hasChildren)}
            className={cn(
              "bf-card flex items-center gap-3 rounded-2xl border-2 p-4",
              hasChildren ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card"
            )}
          >
            <span className="text-2xl">👶</span>
            <span className={cn("text-sm font-medium", hasChildren ? "text-primary" : "text-foreground")}>Tenho crianças</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Consultoria Step 4: O que te incomoda                                */
/* ================================================================== */

const painOptions = [
  { id: "desorganizado", label: "O espaço é desorganizado", icon: "😵" },
  { id: "feio", label: "Não gosto da aparência", icon: "😅" },
  { id: "escuro", label: "É escuro ou mal iluminado", icon: "🌑" },
  { id: "apertado", label: "Parece apertado demais", icon: "📦" },
  { id: "sem-estilo", label: "Não tem personalidade", icon: "😶" },
  { id: "moveis-velhos", label: "Móveis velhos ou inadequados", icon: "🪑" },
  { id: "cores-erradas", label: "Cores não combinam", icon: "🎨" },
  { id: "outro", label: "Outro problema", icon: "💭" },
];

function StepConsultoriaPains({
  painPoints,
  priorities,
  onTogglePain,
  onPriorities,
}: {
  painPoints: string[];
  priorities: string;
  onTogglePain: (p: string) => void;
  onPriorities: (v: string) => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        O que te incomoda hoje? 😅
      </h1>
      <p className="text-muted-foreground mb-6">
        Selecione tudo que se aplica — sem julgamentos! 🙂
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {painOptions.map(({ id, label, icon }) => {
          const active = painPoints.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTogglePain(id)}
              className={cn(
                "bf-card flex items-center gap-3 rounded-2xl border-2 p-4 text-left",
                active ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-xl shrink-0">{icon}</span>
              <span className={cn("text-xs font-medium flex-1", active ? "text-primary" : "text-foreground")}>{label}</span>
              <ToggleSwitch active={active} />
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          O que mais te importa? (opcional) ✨
        </label>
        <textarea
          value={priorities}
          onChange={(e) => onPriorities(e.target.value)}
          placeholder="Ex: quero sentir aconchego quando chego em casa..."
          rows={3}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/* Consultoria Step 6: Budget + Deadline                                */
/* ================================================================== */

const budgetOptions = [
  { value: "Até R$ 3.000", emoji: "💰", desc: "Econômico" },
  { value: "R$ 3.000 – 8.000", emoji: "💵", desc: "Intermediário" },
  { value: "R$ 8.000 – 20.000", emoji: "💎", desc: "Avançado" },
  { value: "Acima de R$ 20.000", emoji: "👑", desc: "Premium" },
];

function StepConsultoriaBudget({
  budgetRange,
  keepItems,
  deadline,
  onBudget,
  onKeep,
  onDeadline,
}: {
  budgetRange: string;
  keepItems: string;
  deadline: string;
  onBudget: (v: string) => void;
  onKeep: (v: string) => void;
  onDeadline: (v: string) => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Orçamento e prazo 💸⏳
      </h1>
      <p className="text-muted-foreground mb-6">
        Últimos detalhes! Falta pouquinho 🙂
      </p>

      <p className="text-sm font-semibold text-foreground mb-3">Quanto quer investir?</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {budgetOptions.map(({ value, emoji, desc }) => {
          const active = budgetRange === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onBudget(value)}
              className={cn(
                "bf-card flex flex-col items-center gap-1 rounded-2xl border-2 p-4",
                active ? "bf-card--active border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-2xl">{emoji}</span>
              <span className={cn("text-xs font-bold", active ? "text-primary" : "text-foreground")}>{value}</span>
              <span className="text-[10px] text-muted-foreground">{desc}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Itens que quer manter (opcional)
        </label>
        <Input
          value={keepItems}
          onChange={(e) => onKeep(e.target.value)}
          placeholder="Ex: sofá cinza, mesa de jantar..."
          className="rounded-xl h-12"
        />
      </div>

      <p className="text-sm font-semibold text-foreground mb-3">Prazo ⏰</p>
      <div className="grid grid-cols-3 gap-3">
        {deadlineCards.map(({ value, label, emoji, className: dcn }) => {
          const active = deadline === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onDeadline(value)}
              className={cn(
                "bf-card flex flex-col items-center gap-1 rounded-2xl border-2 p-4",
                dcn,
                active && "bf-card--active"
              )}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-bold text-foreground">{label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-center text-muted-foreground">
        ⚠️ Prazo máximo: 30 dias
      </p>
    </div>
  );
}
