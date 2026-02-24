import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Briefcase, PlusCircle, User, Wallet, Shield, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminApi } from "@/lib/admin-api";
import type { Project, PaginatedResponse } from "@/types/api";
import { projectStatusLabel } from "@/lib/projectStatus";

export default function Dashboard() {
  const { user, loading, clientProfile } = useAuth();

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
  const isLoadingProjects = !projectsData && user?.role === "CLIENT";

  // No more redirect — zero-state in dashboard handles onboarding

  if (user?.role === "CLIENT" && isLoadingProjects) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                          p.status === "CANCELLED" ? "border-muted bg-muted/30 opacity-90 hover:bg-muted/50" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <span className="font-medium text-foreground truncate">{p.title}</span>
                        <Badge
                          variant={p.status === "CANCELLED" ? "outline" : "secondary"}
                          className={p.status === "CANCELLED" ? "border-muted-foreground/50 text-muted-foreground" : ""}
                        >
                          {projectStatusLabel[p.status] ?? p.status}
                        </Badge>
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
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                        p.status === "CANCELLED" ? "border-muted bg-muted/30 opacity-90 hover:bg-muted/50" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium text-foreground truncate">{p.title}</span>
                      <Badge
                        variant={p.status === "CANCELLED" ? "outline" : "secondary"}
                        className={p.status === "CANCELLED" ? "border-muted-foreground/50 text-muted-foreground" : ""}
                      >
                        {projectStatusLabel[p.status] ?? p.status}
                      </Badge>
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
              <Link to="/comecar">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo projeto ✨
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
    <div className="flex flex-col items-center gap-8 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-brand shadow-brand">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground">Vamos criar seu primeiro projeto? 🙂✨</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Escolha o tipo de projeto e comece sua transformação.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <Link
          to="/comecar/projeto-completo"
          className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 transition-all hover:border-primary/50 hover:shadow-brand hover:-translate-y-1"
        >
          <span className="text-4xl">🏗️</span>
          <span className="text-sm font-bold text-foreground">Projeto Completo</span>
          <span className="text-xs text-muted-foreground text-center">Obra, marcenaria, iluminação e mais</span>
          <span className="text-xs font-semibold text-primary group-hover:gap-2 flex items-center gap-1 transition-all">
            Começar →
          </span>
        </Link>
        <Link
          to="/comecar/consultoria"
          className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-blue-300/20 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 transition-all hover:border-blue-400/50 hover:shadow-md hover:-translate-y-1"
        >
          <span className="text-4xl">💬</span>
          <span className="text-sm font-bold text-foreground">Consultoria</span>
          <span className="text-xs text-muted-foreground text-center">Ideias, orientação e recomendações</span>
          <span className="text-xs font-semibold text-blue-600 group-hover:gap-2 flex items-center gap-1 transition-all">
            Começar →
          </span>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">Leva menos de 5 minutos ✨</p>
    </div>
  );
}


/**
 * Resposta GET /admin/dashboard:
 * { users: { total, clients, professionals }, professionals: { pendingApprovals }, projects: { total, active, completed }, finance: { totalPlatformRevenue, pendingWithdrawals } }
 */
function normalizeAdminDashboard(res: unknown): {
  pendingProfessionals: number;
  pendingWithdrawals: number;
  totalUsers: number;
  totalProjects: number;
  revenue: number;
} {
  const body = (res as { data?: Record<string, unknown> })?.data ?? (res as Record<string, unknown>);
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const users = (root.users && typeof root.users === "object" ? root.users : {}) as Record<string, unknown>;
  const professionals = (root.professionals && typeof root.professionals === "object" ? root.professionals : {}) as Record<string, unknown>;
  const projects = (root.projects && typeof root.projects === "object" ? root.projects : {}) as Record<string, unknown>;
  const finance = (root.finance && typeof root.finance === "object" ? root.finance : {}) as Record<string, unknown>;

  const getNum = (obj: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
    }
    return 0;
  };

  return {
    pendingProfessionals: getNum(professionals, "pendingApprovals", "pending_approvals"),
    pendingWithdrawals: getNum(finance, "pendingWithdrawals", "pending_withdrawals"),
    totalUsers: getNum(users, "total"),
    totalProjects: getNum(projects, "total"),
    revenue: getNum(finance, "totalPlatformRevenue", "total_platform_revenue"),
  };
}

function AdminDashboard() {
  const { data: dashboard } = useQuery({

    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get(adminApi.dashboard);
      return normalizeAdminDashboard(res.data);
    },
  });

  const pendingProfessionals = dashboard?.pendingProfessionals ?? 0;
  const pendingWithdrawals = dashboard?.pendingWithdrawals ?? 0;
  const totalUsers = dashboard?.totalUsers ?? 0;
  const totalProjects = dashboard?.totalProjects ?? 0;
  const revenue = dashboard?.revenue ?? 0;

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
            <p className="text-3xl font-bold text-foreground">{pendingProfessionals}</p>
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
            <p className="text-3xl font-bold text-foreground">{pendingWithdrawals}</p>
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
            <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link to="/app/usuarios">Gerenciar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalProjects}</p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link to="/app/projetos-admin">Ver projetos</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              R$ {revenue.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
