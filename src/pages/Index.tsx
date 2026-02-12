import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Check,
  ArrowRight,
  Palette,
  MessageSquare,
  Sparkles,
  Briefcase,
  Heart,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Landing Page – Decorador.net                                       */
/* ------------------------------------------------------------------ */

export default function Index() {
  return (
    <PublicLayout>
      <HeroSection />
      <WhySection />
      <StepsSection />
      <ProjectsSection />
      <PartnersSection />
      <StatsSection />
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
          <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs font-medium">
            ✨ Marketplace de decoração online
          </Badge>
          <h1 className="text-display-xl text-foreground">
            decor{" "}
            <span className="text-primary">ação</span>
            <br />
            online
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Conectamos você aos melhores decoradores do Brasil. Seu ambiente dos sonhos, do briefing à entrega.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-8 shadow-brand">
              <Link to="/cadastro">Começar agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link to="/explorar">Ver projetos</Link>
            </Button>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-soft">
            <img
              src="/images/ref-hero.png"
              alt="Ambiente decorado"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-6 rounded-xl bg-background p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">+40.000</p>
                <p className="text-xs text-muted-foreground">projetos realizados</p>
              </div>
            </div>
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
          Acreditamos que todos merecem viver em um espaço que inspire, acolha e represente quem são. A decoração transforma ambientes e vidas.
        </p>
      </div>
    </section>
  );
}

/* ======================== STEPS 1-2-3 ======================== */
const steps = [
  {
    num: "1",
    icon: Palette,
    title: "Descubra seu estilo",
    desc: "Responda algumas perguntas rápidas e descubra qual estilo de decoração combina com você.",
  },
  {
    num: "2",
    icon: MessageSquare,
    title: "Conte o que você precisa",
    desc: "Preencha o briefing com os detalhes do seu ambiente: medidas, fotos, preferências e orçamento.",
  },
  {
    num: "3",
    icon: Sparkles,
    title: "Seu sonho se torna realidade",
    desc: "Receba o projeto do decorador, converse, peça ajustes e veja a transformação acontecer.",
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
  const placeholders = Array.from({ length: 6 });
  return (
    <section className="bg-background-soft py-20">
      <div className="container">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-display-md text-foreground">
            Conheça alguns <span className="text-primary">projetos</span>
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Inspire-se com ambientes reais transformados por nossos decoradores parceiros.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placeholders.map((_, i) => (
            <div key={i} className="group aspect-[4/3] overflow-hidden rounded-xl bg-muted transition-transform duration-200 hover:scale-[1.02]">
              <img
                src="/images/ref-projects.png"
                alt={`Projeto ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-8 shadow-brand">
            <Link to="/explorar">
              Veja mais projetos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ======================== PARTNERS ======================== */
function PartnersSection() {
  return (
    <section className="py-20">
      <div className="container text-center">
        <h2 className="text-display-md text-foreground">Nossos parceiros</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Marcas que acreditam na transformação de ambientes e oferecem condições exclusivas.
        </p>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-12 w-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
              Parceiro {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="outline" className="rounded-full px-6">Quer ser um parceiro?</Button>
          <Button variant="outline" className="rounded-full px-6">Cupons de desconto</Button>
        </div>
      </div>
    </section>
  );
}

/* ======================== STATS & TESTIMONIALS ======================== */
const stats = [
  { value: "+40.000", label: "projetos realizados" },
  { value: "+7.000", label: "decoradores" },
  { value: "98%", label: "clientes satisfeitos" },
];

const testimonials = [
  { name: "Maria Clara", role: "Cliente", text: "Meu apartamento ficou incrível! O processo foi super fácil e o resultado superou todas as expectativas.", rating: 5 },
  { name: "João Pedro", role: "Cliente", text: "Recomendo demais! Encontrei uma decoradora maravilhosa que entendeu exatamente o que eu queria.", rating: 5 },
  { name: "Ana Beatriz", role: "Cliente", text: "Preço justo e resultado profissional. A plataforma facilita muito a comunicação com o decorador.", rating: 4 },
];

function StatsSection() {
  return (
    <section className="bg-highlight py-20 text-highlight-foreground">
      <div className="container">
        <div className="flex flex-wrap justify-center gap-12 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-display-lg font-extrabold">{s.value}</p>
              <p className="mt-1 text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-0 bg-background/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-white/30"}`} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-highlight-foreground/90">"{t.text}"</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs opacity-70">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================== PRICING ======================== */
const pricingFeatures = [
  "Projeto completo do ambiente",
  "Lista de compras personalizada",
  "Planta baixa com layout",
  "Moodboard exclusivo",
  "Até 3 revisões incluídas",
  "Suporte via chat com o decorador",
  "Entrega em até 15 dias úteis",
];

function PricingSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl gradient-brand p-[1px]">
          <div className="rounded-3xl gradient-brand px-8 py-14 text-center text-white">
            <Badge className="mb-6 rounded-full border-white/30 bg-white/20 px-4 py-1 text-white">
              Projeto Completo
            </Badge>
            <h2 className="text-display-lg">
              R$ <span className="text-5xl font-extrabold md:text-6xl">319</span>,00
            </h2>
            <p className="mt-2 text-sm opacity-80">por ambiente • pagamento único</p>
            <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm">
              {pricingFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-10 rounded-full bg-white px-10 text-primary shadow-brand hover:bg-white/90">
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
            Cadastre-se como profissional, monte seu portfólio e receba projetos de clientes em todo o Brasil.
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
