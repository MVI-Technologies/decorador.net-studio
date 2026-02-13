import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProfessionalProfile } from "@/types/api";

export default function ExplorarDetail() {
  const { id } = useParams<{ id: string }>();
  const [showInfo, setShowInfo] = useState(true);

  const { data: prof, isLoading } = useQuery({
    queryKey: ["professional", id],
    queryFn: async () => {
      const res = await api.get<ProfessionalProfile>(`/professionals/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (!id) {
    return (
      <PublicLayout>
        <div className="container py-10 text-center">
          <p className="text-muted-foreground">ID não informado.</p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/explorar">Voltar à listagem</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (isLoading || !prof) {
    return (
      <PublicLayout>
        <div className="container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="aspect-video rounded-2xl bg-muted animate-pulse" />
            <div className="mt-6 h-8 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  const portfolio = prof.portfolioItems ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = portfolio[selectedIndex]?.imageUrl ?? null;

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#2a2d30]">
        <div className="container py-6">
          <div className="mx-auto max-w-5xl">
            {/* Viewer central */}
            <div className="rounded-2xl overflow-hidden bg-black/40 aspect-video flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={portfolio[selectedIndex]?.title ?? "Projeto"}
                  className="max-h-full w-full object-contain"
                />
              ) : (
                <span className="text-white/60">Nenhuma imagem no portfólio</span>
              )}
            </div>

            {/* Thumbnails */}
            {portfolio.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {portfolio.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedIndex === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Bloco perfil + lista / infos */}
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Tabs defaultValue="produtos" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="produtos">Produtos</TabsTrigger>
                    <TabsTrigger value="infos">Infos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="produtos" className="mt-4">
                    <p className="text-sm text-white/80">
                      Lista de produtos e referências deste projeto. (Integração futura.)
                    </p>
                  </TabsContent>
                  <TabsContent value="infos" className="mt-4">
                    <p className="text-sm text-white/80">{prof.bio ?? "Sem descrição."}</p>
                    {prof.styles?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {prof.styles.map((s) => (
                          <Badge key={s.id} variant="secondary">{s.name}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </TabsContent>
                </Tabs>

                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4">
                  <Switch
                    id="show-info"
                    checked={showInfo}
                    onCheckedChange={setShowInfo}
                  />
                  <Label htmlFor="show-info" className="text-sm text-white/90">
                    Mostrar infos e produtos
                  </Label>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={prof.user?.avatarUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {(prof.displayName ?? prof.user?.name ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">
                          {prof.displayName ?? prof.user?.name ?? "Decorador"}
                        </p>
                        {(prof.averageRating != null || (prof.reviewCount ?? 0) > 0) && (
                          <div className="flex items-center gap-1 text-sm text-white/70">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {prof.averageRating?.toFixed(1)} ({prof.reviewCount ?? 0} avaliações)
                          </div>
                        )}
                      </div>
                    </div>
                    <Button asChild className="mt-4 w-full rounded-full shadow-brand">
                      <Link to="/cadastro">Contratar este decorador</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button asChild variant="outline" className="rounded-full">
              <Link to="/explorar">Ver mais projetos</Link>
            </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
