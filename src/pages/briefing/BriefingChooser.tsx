import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import { Emoji } from "@/components/ui/Emoji";
import "../briefing/briefing-flow.css";

/* ================================================================== */
/* BriefingChooser — Tela de escolha do tipo de briefing         !     */
/* ================================================================== */

const options = [
  {
    id: "completo",
    title: "Projeto Completo",
    emoji: "🏠",
    desc: "Projeto detalhado com obra, marcenaria, iluminação, revestimentos e muito mais ✨",
    features: [
      "Planta e layout completos",
      "Marcenaria sob medida",
      "Iluminação e elétrica",
      "Direcionamento de obra",
    ],
    cta: "Começar projeto →",
    to: "/comecar/projeto-completo",
    gradient: "from-primary/10 to-primary/5",
    border: "border-primary/30 hover:border-primary/60",
    badgeColor: "bg-primary/10 text-primary",
    time: "~5 min",
  },
  {
    id: "consultoria",
    title: "Consultoria",
    emoji: "💬",
    desc: "Orientação, ideias e recomendações de um profissional para transformar o seu espaço 🪄",
    features: [
      "Análise do ambiente atual",
      "Sugestões de melhorias",
      "Indicações de produtos",
      "Dicas de estilo",
    ],
    cta: "Pedir consultoria →",
    to: "/comecar/consultoria",
    gradient: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-300/30 hover:border-blue-400/60",
    badgeColor: "bg-blue-50 text-blue-600",
    time: "~3 min",
  },
];

export default function BriefingChooser() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-brand shadow-brand">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Decor.net</h1>
            <p className="text-xs text-muted-foreground">Seu projeto começa aqui <Emoji>✨</Emoji></p>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Como podemos te ajudar? <Emoji>🙂</Emoji>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Escolha o caminho que faz mais sentido pra você. Sem cadastro, sem compromisso — é rápido e divertido <Emoji>✨</Emoji>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {options.map((opt) => (
          <Link
              key={opt.id}
              to={opt.to}
              onClick={() => { localStorage.removeItem(`decorador-briefing-${opt.id}`); window.scrollTo(0, 0); }}
              className={cn(
                "bf-card group relative flex flex-col rounded-3xl border-2 bg-gradient-to-br p-8 transition-all",
                opt.gradient,
                opt.border
              )}
            >
              {/* Time badge */}
              <span className={cn("absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-medium", opt.badgeColor)}>
                {opt.time}
              </span>

              {/* Icon */}
              <span className="text-5xl mb-4"><Emoji>{opt.emoji}</Emoji></span>

              {/* Title */}
              <h2 className="text-2xl font-bold text-foreground mb-2">{opt.title}</h2>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-5"><Emoji>{opt.desc}</Emoji></p>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {opt.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                <span>{opt.cta}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Nenhum cadastro necessário para começar! Você pode criar conta quando quiser <Emoji>🙂</Emoji>
        </p>
      </main>
    </div>
  );
}
