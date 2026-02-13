import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import type { Project } from "@/types/api";

export default function DeliveryResult() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get<Project>(`/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="container py-10 text-center">
        <p className="text-muted-foreground">ID não informado.</p>
        <Button asChild className="mt-4 rounded-full">
          <Link to="/app/projetos">Voltar aos projetos</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const prof = project.professionalProfile;
  const portfolio = prof?.portfolioItems ?? [];
  const firstImage = portfolio[0]?.imageUrl;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background z-10" />
        {firstImage && (
          <div className="absolute inset-0">
            <img src={firstImage} alt="" className="h-full w-full object-cover opacity-30" />
          </div>
        )}
        <div className="container relative z-20 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-display-xl text-foreground">
              Seu projeto está <span className="text-primary">pronto!</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              O ambiente foi entregue e aprovado. Avalie a experiência para ajudar outros clientes.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-full shadow-brand px-8">
                <Link to={`/app/projetos/${id}`}>
                  <Star className="mr-2 h-5 w-5" />
                  Avaliar entrega
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/app/projetos">Ver meus projetos</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {portfolio.length > 0 && (
        <div className="container py-10">
          <h2 className="text-display-md text-foreground text-center">Projeto entregue</h2>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
            {portfolio.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="h-32 w-48 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {prof && (
        <div className="container pb-16">
          <Card className="mx-auto max-w-md overflow-hidden border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={prof.user?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {(prof.displayName ?? prof.user?.name ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground text-lg">
                    {prof.displayName ?? prof.user?.name ?? "Decorador"}
                  </p>
                  <p className="text-sm text-muted-foreground">Decorador do projeto</p>
                </div>
              </div>
              <Button asChild variant="outline" className="mt-4 w-full rounded-full">
                <Link to={`/explorar/${prof.id}`}>Ver perfil do decorador</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
