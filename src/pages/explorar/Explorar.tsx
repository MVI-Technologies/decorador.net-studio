import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProfessionalProfile } from "@/types/api";

export default function Explorar() {
  const { data, isLoading } = useQuery({
    queryKey: ["professionals-public"],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: ProfessionalProfile[] } | ProfessionalProfile[]>("/professionals", {
          params: { limit: 50 },
        });
        const body = res.data as { data?: ProfessionalProfile[] };
        return Array.isArray(body) ? body : (body.data ?? []);
      } catch {
        return [];
      }
    },
  });

  const professionals = data ?? [];

  return (
    <PublicLayout>
      <div className="container py-10">
        <div className="mb-10 text-center">
          <h1 className="text-display-lg text-foreground">
            Conheça alguns <span className="text-primary">projetos</span>
          </h1>
          <p className="mt-3 max-w-lg mx-auto text-muted-foreground">
            Inspire-se com ambientes reais transformados por nossos decoradores parceiros.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
            <p className="text-muted-foreground">Nenhum profissional aprovado ainda.</p>
            <Button asChild className="mt-4 rounded-full shadow-brand">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {professionals
              .filter((p) => p.status === "APPROVED")
              .map((prof) => (
                <Card key={prof.id} className="overflow-hidden transition-shadow hover:shadow-soft">
                  <Link to={`/explorar/${prof.id}`} className="block">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {prof.portfolioItems?.[0]?.imageUrl ? (
                        <img
                          src={prof.portfolioItems[0].imageUrl}
                          alt={prof.portfolioItems[0].title}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={prof.user?.avatarUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {(prof.displayName ?? prof.user?.name ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {prof.displayName ?? prof.user?.name ?? "Decorador"}
                          </p>
                          {(prof.averageRating != null || (prof.reviewCount ?? 0) > 0) && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />
                              <span>{prof.averageRating?.toFixed(1) ?? "—"}</span>
                              <span>({prof.reviewCount ?? 0})</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {prof.styles?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {prof.styles.slice(0, 3).map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Link>
                </Card>
              ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link to="/">Ver mais na home</Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
