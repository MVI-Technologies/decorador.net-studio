import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Inbox, Star } from "lucide-react";
import { toast } from "sonner";

export default function UiKit() {
  return (
    <PublicLayout>
      <div className="container py-10 space-y-16">
        <header>
          <h1 className="text-display-xl text-foreground">UI Kit</h1>
          <p className="mt-2 text-muted-foreground">Design system do Decor.net — todos os componentes base.</p>
        </header>

        {/* Typography */}
        <Section title="Tipografia">
          <h1 className="text-display-xl text-foreground">Display XL — decor ação</h1>
          <h2 className="text-display-lg text-foreground">Display LG — Heading</h2>
          <h3 className="text-display-md text-foreground">Display MD — Subheading</h3>
          <p className="text-lg text-foreground">Body Large</p>
          <p className="text-base text-foreground">Body Base</p>
          <p className="text-sm text-muted-foreground">Body Small — muted</p>
          <p className="text-xs text-muted-foreground">Caption — muted</p>
          <p className="text-gradient-brand text-2xl font-bold">Texto com gradiente brand</p>
        </Section>

        {/* Buttons */}
        <Section title="Botões">
          <div className="flex flex-wrap gap-3">
            <Button>Primário (magenta)</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destrutivo</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Star className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-full px-8 shadow-brand">CTA magenta arredondado</Button>
            <Button variant="outline" className="rounded-full px-8">Outline arredondado</Button>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-3">
            <Badge>Default (magenta)</Badge>
            <Badge variant="secondary">Secundário</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destrutivo</Badge>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Card padrão</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Conteúdo do card com sombra suave e border-radius.</p></CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader><CardTitle>Card shadow-soft</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Sombra mais difusa e elegante.</p></CardContent>
            </Card>
            <Card className="gradient-brand text-white border-0">
              <CardHeader><CardTitle>Card gradiente</CardTitle></CardHeader>
              <CardContent><p className="text-sm opacity-90">Card com gradiente rosa→roxo.</p></CardContent>
            </Card>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <div className="max-w-md space-y-3">
            <Input placeholder="Nome completo" />
            <Input type="email" placeholder="email@exemplo.com" />
            <Input disabled placeholder="Desabilitado" />
          </div>
        </Section>

        {/* Switch */}
        <Section title="Switch">
          <div className="flex items-center gap-3">
            <Switch id="switch-demo" />
            <label htmlFor="switch-demo" className="text-sm text-foreground">Mostrar infos e produtos</label>
          </div>
        </Section>

        {/* Tabs */}
        <Section title="Tabs">
          <Tabs defaultValue="tab1" className="max-w-md">
            <TabsList>
              <TabsTrigger value="tab1">Produtos</TabsTrigger>
              <TabsTrigger value="tab2">Infos</TabsTrigger>
              <TabsTrigger value="tab3">Detalhes</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1"><p className="mt-3 text-sm text-muted-foreground">Conteúdo de produtos.</p></TabsContent>
            <TabsContent value="tab2"><p className="mt-3 text-sm text-muted-foreground">Conteúdo de informações.</p></TabsContent>
            <TabsContent value="tab3"><p className="mt-3 text-sm text-muted-foreground">Conteúdo de detalhes.</p></TabsContent>
          </Tabs>
        </Section>

        {/* Dialog */}
        <Section title="Modal (Dialog)">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Título do Modal</DialogTitle>
                <DialogDescription>Descrição de suporte para o modal.</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Conteúdo do modal aqui.</p>
            </DialogContent>
          </Dialog>
        </Section>

        {/* Toast */}
        <Section title="Toast">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => toast.success("Sucesso!", { description: "Ação realizada com sucesso." })}>
              Toast sucesso
            </Button>
            <Button variant="outline" onClick={() => toast.error("Erro!", { description: "Algo deu errado." })}>
              Toast erro
            </Button>
            <Button variant="outline" onClick={() => toast.info("Info", { description: "Informação importante." })}>
              Toast info
            </Button>
          </div>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton">
          <div className="space-y-3 max-w-md">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </Section>

        {/* Empty State */}
        <Section title="Empty State">
          <EmptyState
            icon={Inbox}
            title="Nenhum projeto encontrado"
            description="Você ainda não criou nenhum projeto. Comece agora!"
          >
            <Button className="rounded-full px-6 shadow-brand">Criar projeto</Button>
          </EmptyState>
        </Section>

        {/* Colors */}
        <Section title="Paleta de cores">
          <div className="flex flex-wrap gap-3">
            <Swatch className="bg-primary" label="Primary (magenta)" />
            <Swatch className="gradient-brand" label="Gradiente brand" />
            <Swatch className="bg-highlight" label="Highlight (azul)" />
            <Swatch className="bg-background-soft" label="BG soft" border />
            <Swatch className="bg-background-cool" label="BG cool" border />
            <Swatch className="bg-muted" label="Muted" border />
            <Swatch className="bg-destructive" label="Destructive" />
          </div>
        </Section>
      </div>
    </PublicLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-6 text-xl font-bold text-foreground border-b border-border pb-2">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Swatch({ className, label, border }: { className: string; label: string; border?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-14 w-14 rounded-xl ${className} ${border ? "border border-border" : ""}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
