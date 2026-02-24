import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Project } from "@/types/api";
import BriefingFlow from "@/pages/briefing/BriefingFlow";
import type { BriefingMode, BriefingState } from "@/pages/briefing/BriefingFlow";

/* ================================================================== */
/* Helper: parse requirements string → partial BriefingState            */
/* ================================================================== */

function parseRequirements(raw: string, mode: BriefingMode): Partial<BriefingState> {
  const result: Partial<BriefingState> = {};
  if (!raw) return result;
  const entries = raw.split("; ").filter(Boolean);
  for (const entry of entries) {
    const sep = entry.indexOf(": ");
    if (sep === -1) continue;
    const key = entry.slice(0, sep).trim();
    const val = entry.slice(sep + 2).trim();
    if (mode === "completo") {
      if (key === "Inten\u00e7\u00f5es") result.intentions = val.split("; ").filter(Boolean);
      if (key === "Bairro") result.bairro = val;
      if (key === "Cidade") result.city = val;
      if (key === "Estado") result.state = val;
      if (key === "Prazo" && val.includes(" dias")) result.deadline = val.replace(" dias", "");
    } else {
      if (key === "Problemas") result.painPoints = val.split("; ").filter(Boolean);
      if (key === "Prioridades") result.priorities = val;
      if (key === "Moradores") result.residents = val;
      if (key === "Or\u00e7amento") result.budgetRange = val;
      if (key === "Manter") result.keepItems = val;
      if (key === "Tem pets") result.hasPets = true;
      if (key === "Tem crian\u00e7as") result.hasChildren = true;
      if (key === "Prazo" && val.includes(" dias")) result.deadline = val.replace(" dias", "");
    }
  }
  return result;
}

/* ================================================================== */
/* Legacy read-only screen                                              */
/* ================================================================== */

function LegacyReadOnly({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Briefing legado 📋</h1>
      <p className="text-muted-foreground text-sm mb-2 max-w-sm">
        Este projeto foi criado antes do novo formato. N\u00e3o \u00e9 poss\u00edvel editar pelo sistema antigo.
      </p>
      <p className="text-sm font-semibold text-foreground mb-8">{projectTitle}</p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          className="rounded-full shadow-brand px-8 text-white"
          size="lg"
          onClick={() => navigate("/comecar/projeto-completo")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Refazer como Projeto Completo ✨
        </Button>
        <Button
          variant="outline"
          className="rounded-full px-8"
          size="lg"
          onClick={() => navigate("/comecar/consultoria")}
        >
          Refazer como Consultoria 💬
        </Button>
      </div>
      <Button asChild variant="ghost" size="sm" className="mt-6 rounded-full text-muted-foreground">
        <Link to={`/app/projetos/${projectId}`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar ao projeto
        </Link>
      </Button>
    </div>
  );
}

/* ================================================================== */
/* Main                                                                  */
/* ================================================================== */

type AnyProject = Project & {
  requirements?: string;
  stylePreferences?: string[];
  briefing?: {
    id?: string;
    requirements?: string;
    stylePreferences?: string[];
    roomSize?: string;
    roomType?: string;
  };
};

export default function EditarBriefing() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      const payload = res.data?.data ?? res.data ?? {};
      return (payload?.project ?? payload) as AnyProject;
    },
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">ID n\u00e3o informado.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/app/projetos">Voltar</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = project.title ?? "";
  const isCompleto = title.startsWith("Projeto Completo");
  const isConsultoria = title.startsWith("Consultoria");
  const isLegacy = !isCompleto && !isConsultoria;

  if (isLegacy) {
    return <LegacyReadOnly projectId={id} projectTitle={title} />;
  }

  const detectedMode: BriefingMode = isConsultoria ? "consultoria" : "completo";
  const b = project.briefing ?? {};
  const reqString: string =
    (b.requirements as string | undefined) ??
    (project.requirements as string | undefined) ??
    "";
  const styles: string[] =
    (b.stylePreferences as string[] | undefined) ??
    (project.stylePreferences as string[] | undefined) ??
    [];
  const roomSize: string = (b.roomSize as string | undefined) ?? "";

  const parsedReqs = parseRequirements(reqString, detectedMode);
  const prefilledState: Partial<BriefingState> = {
    // Start at step 2 (result screen) — skips the style quiz redo
    step: 2,
    chosenStyles: styles,
    detectedStyle: styles[0] ?? "",
    roomSize,
    ...parsedReqs,
  };

  const briefingOrProjectId = (b.id as string | undefined) ?? id;

  return (
    <BriefingFlow
      mode={detectedMode}
      initialData={prefilledState}
      editProjectId={briefingOrProjectId}
    />
  );
}
