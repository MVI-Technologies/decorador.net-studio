import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
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

/* ======================== PRICING ======================== */
function PricingSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl gradient-brand p-[1px]">
          <div className="rounded-3xl gradient-brand px-8 py-14 text-center text-white">
            <h2 className="text-display-lg">Projeto completo</h2>
            <p className="mt-2 text-sm opacity-80">A partir de 199,90R$ </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-white px-10 text-primary shadow-brand hover:bg-white/90">
              <Link to="/cadastro">Começar meu projeto</Link>
            </Button>
          </div>
        </div>
      </div>
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
