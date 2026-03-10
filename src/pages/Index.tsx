import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Emoji } from "@/components/ui/Emoji";
import {
  ArrowRight,
  Palette,
  MessageSquare,
  Sparkles,
  Briefcase,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Landing Page – Decorador.net (estado cru, sem dados mockados)      */
/* ------------------------------------------------------------------ */

export default function Index() {
  return (
    <PublicLayout>
      <HeroSection />
      <WhySection />
      <StepsSection />
      <ProjectsSection />
      <PricingSection />
      <DecoratorCTASection />
    </PublicLayout>
  );
}

/* ======================== HERO ======================== */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container grid min-h-[85vh] items-center gap-8 py-20 md:grid-cols-2">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <span className="rounded-full bg-muted px-4 py-1 text-xs font-medium text-muted-foreground">
            Marketplace de decoração online
          </span>
          <h1 className="text-display-xl text-foreground">
            decor
            <span className="text-primary">ação</span>
            <br />
            online
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Conectamos você aos melhores decoradores do Brasil. O seu ambiente dos sonhos feito por um profissional de verdade.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-8 shadow-brand">
              <Link to="/comecar">Começar agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link to="/explorar">Ver projetos</Link>
            </Button>
          </div>
        </div>

        {/* Image — visible on all screen sizes */}
        <div className="relative w-full">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted shadow-soft">
            <img
              src="/images/premium_photo-1688125414656-ab91164cbd1e.avif"
              alt="Hero"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ======================== WHY ======================== */
function WhySection() {
  return (
    <section className="bg-background-soft py-20">
      <div className="container text-center">
        <h2 className="text-display-md text-foreground">
          Porque morar bem,{" "}
          <span className="text-primary">faz bem pra alma</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          A decoração transforma ambientes e vidas.
        </p>
      </div>
    </section>
  );
}

/* ======================== STEPS ======================== */
const steps = [
  {
    num: "1",
    icon: Palette,
    title: "Descubra seu estilo",
    desc: "Preencha o briefing com o que você precisa.",
  },
  {
    num: "2",
    icon: MessageSquare,
    title: "Conte o que você precisa",
    desc: "Medidas, fotos, preferências e orçamento.",
  },
  {
    num: "3",
    icon: Sparkles,
    title: "Seu sonho se torna realidade",
    desc: "Receba o projeto, converse e peça ajustes.",
  },
];

function StepsSection() {
  return (
    <section className="py-20">
      <div className="container">
        <h2 className="text-center text-display-md text-foreground">Como funciona</h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="relative text-center">
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 select-none text-[8rem] font-extrabold leading-none text-primary/5">
                {s.num}
              </span>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================== PROJECTS ======================== */
function ProjectsSection() {
  return (
    <section className="bg-background-soft py-20">
      <div className="container">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-display-md text-foreground">
            Conheça alguns <span className="text-primary">projetos</span>
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Veja o que nossos decoradores já entregaram.
          </p>
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-8 shadow-brand">
            <Link to="/explorar">
              Ver projetos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ======================== SERVICES ======================== */

const projetoFeatures = [
  "Chat com o Decorador",
  "Briefing do Projeto",
  "Texto Defesa Criativa do Projeto",
  "Links de Móveis, Objetos e Revestimentos",
  "Revisão do Projeto (até 7 dias)",
  "Imagens de Referência",
  "Entrega em até 25 dias",
  "Planta Baixa",
  "Imagens 3D",
  "Mais profissionais disponíveis para escolha",
  "Detalhamentos (desenhos técnicos)",
  "Proj. de marcenaria, forro e elétrica/hidráulica (opcionais)",
  "Ambientes integrados e comerciais",
];

const consultoriaFeatures = [
  "Chat com o Decorador",
  "Briefing do Projeto",
  "Texto Defesa Criativa do Projeto",
  "Mural de Ideias",
  "Links de Móveis, Objetos e Revestimentos",
  "Revisão da consultoria (até 48 horas)",
  "Imagens de Referência",
  "Entrega em até 7 dias",
  "Planta Baixa",
  "Ambientes integrados e comerciais",
];

function PricingSection() {
  return (
    <section style={{ padding: "60px 24px" }}>
      <style>{`
        .services-row {
          display: flex;
          flex-direction: row;
          gap: 24px;
          justify-content: center;
          align-items: stretch;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0;
        }
        .service-card {
          flex: 1;
          max-width: 500px;
          border-radius: 20px;
          padding: 28px;
          position: relative;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }
        .service-card:hover {
          transform: translateY(-4px);
        }
        .service-card--projeto {
          background: #FFF0F3;
          border: 1.5px solid #FFD6E0;
        }
        .service-card--projeto:hover {
          box-shadow: 0 12px 40px rgba(247,49,138,0.12);
        }
        .service-card--consultoria {
          background: #F0F4FF;
          border: 1.5px solid #C7D7FF;
        }
        .service-card--consultoria:hover {
          box-shadow: 0 12px 40px rgba(99,102,241,0.10);
        }
        .service-badge--pink {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(247,49,138,0.10);
          color: #F7318A;
          font-size: 12px;
          font-weight: 600;
          border-radius: 100px;
          padding: 4px 10px;
        }
        .service-badge--indigo {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(99,102,241,0.10);
          color: #6366F1;
          font-size: 12px;
          font-weight: 600;
          border-radius: 100px;
          padding: 4px 10px;
        }
        .service-cta--pink {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #F7318A;
          font-weight: 700;
          font-size: 14px;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 20px;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        .service-cta--pink:hover { opacity: 0.8; text-decoration: underline; }
        .service-cta--indigo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #6366F1;
          font-weight: 700;
          font-size: 14px;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 20px;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        .service-cta--indigo:hover { opacity: 0.8; text-decoration: underline; }
        .feature-list::-webkit-scrollbar { width: 4px; }
        .feature-list--pink::-webkit-scrollbar-thumb { background: #F7318A; border-radius: 4px; }
        .feature-list--pink::-webkit-scrollbar-track { background: rgba(247,49,138,0.08); border-radius: 4px; }
        .feature-list--indigo::-webkit-scrollbar-thumb { background: #6366F1; border-radius: 4px; }
        .feature-list--indigo::-webkit-scrollbar-track { background: rgba(99,102,241,0.08); border-radius: 4px; }
        @media (max-width: 768px) {
          .services-row { flex-direction: column; align-items: center; }
          .service-card { max-width: 100%; width: 100%; }
        }
      `}</style>

      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
<h2 style={{ fontSize: 32, fontWeight: 800, color: "#1A1A2E", margin: "0 0 8px" }}>
  Como podemos te ajudar?{" "}
  <Emoji className="emoji-inline">🙂</Emoji>
</h2>
        <p style={{ fontSize: 15, color: "#6B7280", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
          Escolha o caminho que faz mais sentido pra você. Sem cadastro,
          sem compromisso — é rápido e divertido <Emoji>✨</Emoji>
        </p>
      </div>

      <div className="services-row">
        {/* Card 1 — Projeto Completo */}
        <div className="service-card service-card--projeto">
          {/* Icon + Price row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 40 }}>
              <Emoji>🏗️</Emoji>
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#F7318A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>a partir de</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F7318A", lineHeight: 1 }}>R$</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#1A1A2E", lineHeight: 1, letterSpacing: "-0.5px" }}>199</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", lineHeight: 1 }}>,90</span>
              </div>
            </div>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1A1A2E", margin: "0 0 6px" }}>
            Projeto Completo
          </h3>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "0 0 16px" }}>
            Projeto detalhado com obra, marcenaria, iluminação, revestimentos e muito mais <Emoji>✨</Emoji>
          </p>
          <ul className="feature-list feature-list--pink" style={{
            listStyle: "none", padding: 0, margin: 0,
            maxHeight: 290,
            overflowY: "auto",
          }}>
            {projetoFeatures.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", padding: "4px 0" }}>
                <span style={{ color: "#F7318A", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          <Link to="/comecar/projeto-completo" className="service-cta--pink" onClick={() => { localStorage.removeItem("decorador-briefing-completo"); window.scrollTo(0, 0); }}>
            Começar projeto →
          </Link>
        </div>

        {/* Card 2 — Consultoria */}
        <div className="service-card service-card--consultoria">
          {/* Icon + Price row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#1A1A2E" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <circle cx="9" cy="12" r="0.8" fill="currentColor"/>
                <circle cx="12" cy="12" r="0.8" fill="currentColor"/>
                <circle cx="15" cy="12" r="0.8" fill="currentColor"/>
              </svg>
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>a partir de</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", lineHeight: 1 }}>R$</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#1A1A2E", lineHeight: 1, letterSpacing: "-0.5px" }}>199</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", lineHeight: 1 }}>,90</span>
              </div>
            </div>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1A1A2E", margin: "0 0 6px" }}>
            Consultoria
          </h3>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "0 0 16px" }}>
            Orientação, ideias e recomendações de um profissional para transformar o seu espaço <Emoji>🪄</Emoji>
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
            {consultoriaFeatures.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", padding: "4px 0" }}>
                <span style={{ color: "#6366F1", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link to="/comecar/consultoria" className="service-cta--indigo" onClick={() => { localStorage.removeItem("decorador-briefing-consultoria"); window.scrollTo(0, 0); }}>
            Pedir consultoria →
          </Link>
        </div>
      </div>

      {/* Bottom note */}
      <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 20 }}>
        Nenhum cadastro necessário para começar. Você pode criar conta quando quiser!
      </p>
    </section>
  );
}

/* ======================== DECORATOR CTA ======================== */
function DecoratorCTASection() {
  return (
    <section className="bg-background-soft py-20">
      <div className="container text-center">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Briefcase className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-display-md text-foreground">
            Você é <span className="text-primary">decorador</span>?
          </h2>
          <p className="text-muted-foreground">
            Cadastre-se como profissional e receba projetos de clientes.
          </p>
          <Button asChild size="lg" className="mt-2 rounded-full px-8 shadow-brand">
            <Link to="/cadastro?role=professional">
              Cadastrar como decorador <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
