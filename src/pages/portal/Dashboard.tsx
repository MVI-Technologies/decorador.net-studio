import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Briefcase, PlusCircle, User, Wallet, Shield, ArrowRight, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Project, PaginatedResponse } from "@/types/api";
import { projectStatusLabel } from "@/lib/projectStatus";
import { useFirstAccess } from "@/hooks/useFirstAccess";

export default function Dashboard() {
  const { user, loading, clientProfile } = useAuth();
  const { isFirstAccess } = useFirstAccess();

  const { data: projectsData } = useQuery({
    queryKey: user?.role === "CLIENT" ? ["projects"] : ["professional-projects"],
    queryFn: async () => {
      if (user?.role === "CLIENT") {
        const res = await api.get<PaginatedResponse<Project>>("/projects", { params: { limit: 5 } });
        return res.data;
      }
      if (user?.role === "PROFESSIONAL") {
        const res = await api.get<PaginatedResponse<Project>>("/professionals/me/projects", { params: { limit: 5 } });
        return res.data;
      }
      return { data: [], meta: { total: 0, page: 1, limit: 5, totalPages: 0 } };
    },
    enabled: !!user && (user.role === "CLIENT" || user.role === "PROFESSIONAL"),
  });

  const raw = projectsData?.data;
  const projects = Array.isArray(raw) ? raw : (raw?.data ?? []);

  // Redirect CLIENT to onboarding on first access.
  // Guard: only redirect once the profile is fully loaded from the API.
  if (!loading && user?.role === "CLIENT" && clientProfile !== null && isFirstAccess()) {
    return <Navigate to="/app/onboarding" replace />;
  }

  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  if (user?.role === "PROFESSIONAL") {
    return (
      <div className="container py-8">
        <h1 className="text-display-md text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Seus projetos atribuídos e ações rápidas.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Projetos recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="Nenhum projeto ainda"
                  description="Quando um cliente atribuir um projeto a você, ele aparecerá aqui."
                >
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/app/meu-perfil">Completar perfil</Link>
                  </Button>
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/app/projetos/${p.id}`}
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                      >
                        <span className="font-medium text-foreground truncate">{p.title}</span>
                        <Badge variant="secondary">{projectStatusLabel[p.status] ?? p.status}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="rounded-full shadow-brand w-full">
                <Link to="/app/pagamentos">Ver saldo e saques</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Seus projetos e próximos passos.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Projetos recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <ClientZeroState />
            ) : (
              <ul className="space-y-3">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/app/projetos/${p.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium text-foreground truncate">{p.title}</span>
                      <Badge variant="secondary">{projectStatusLabel[p.status] ?? p.status}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Começar agora</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full shadow-brand w-full">
              <Link to="/app/novo-briefing">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo briefing
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientZeroState() {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-brand shadow-brand">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground">Seu espaço dos sonhos te espera</h3>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Crie seu primeiro projeto e encontre o decorador ideal para transformar seu ambiente.
        </p>
      </div>
      <Button asChild className="rounded-full shadow-brand px-8" size="lg">
        <Link to="/app/onboarding">
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar meu primeiro projeto
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground">Leva menos de 2 minutos ✨</p>
    </div>
  );
}


function AdminDashboard() {
  const { data: dashboard } = useQuery({

    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get<{ pendingProfessionals?: number; pendingWithdrawals?: number; totalUsers?: number }>("/admin/dashboard");
      return res.data;
    },
  });

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Admin — Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Visão geral e ações pendentes.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profissionais pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{dashboard?.pendingProfessionals ?? 0}</p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link to="/app/profissionais-pendentes">Revisar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Saques pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{dashboard?.pendingWithdrawals ?? 0}</p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link to="/app/saques">Processar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{dashboard?.totalUsers ?? 0}</p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link to="/app/usuarios">Gerenciar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
