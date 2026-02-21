import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { projectStatusLabel } from "@/lib/projectStatus";
import type { Project, PaginatedResponse } from "@/types/api";
import { MessageSquare } from "lucide-react";
import { useChatUnread } from "@/hooks/useChatUnread";

/** Statuses em que o projeto tem chat (inclui cancelados para histórico). */
const CHAT_STATUSES: string[] = [
  "MATCHING",
  "NEGOCIANDO",
  "PROFESSIONAL_ASSIGNED",
  "IN_PROGRESS",
  "REVISION_REQUESTED",
  "DELIVERED",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
];

const limit = 50;

function getOtherPartyName(project: Project, role: "CLIENT" | "PROFESSIONAL"): string {
  if (role === "CLIENT") {
    const prof = project.professionalProfile;
    return prof?.displayName ?? (prof?.user as { name?: string })?.name ?? "Decorador";
  }
  const client = project.client as { name?: string } | undefined;
  return client?.name ?? "Cliente";
}

export default function Chats() {
  const { user } = useAuth();
  const { byProject } = useChatUnread();

  const { data, isLoading } = useQuery({
    queryKey: user?.role === "CLIENT" ? ["projects-chats"] : ["professional-projects-chats"],
    queryFn: async () => {
      if (user?.role === "CLIENT") {
        const res = await api.get<PaginatedResponse<Project>>("/projects", { params: { page: 1, limit } });
        return res.data;
      }
      const res = await api.get<PaginatedResponse<Project>>("/professionals/me/projects", { params: { page: 1, limit } });
      return res.data;
    },
    enabled: !!user && (user.role === "CLIENT" || user.role === "PROFESSIONAL"),
  });

  const raw = data?.data;
  const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const allProjects = Array.isArray(arr) ? arr : [];
  const projectsWithChat = allProjects.filter((p) => CHAT_STATUSES.includes(p.status));

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Chats</h1>
      <p className="mt-2 text-muted-foreground">
        {user?.role === "CLIENT"
          ? "Conversas abertas com os decoradores dos seus projetos."
          : "Conversas abertas com os clientes dos seus projetos."}
      </p>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : projectsWithChat.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhuma conversa"
          description={
            user?.role === "CLIENT"
              ? "Quando você tiver projetos em andamento ou em negociação, as conversas aparecerão aqui."
              : "Quando clientes atribuírem projetos a você, as conversas aparecerão aqui."
          }
          className="mt-10"
        />
      ) : (
        <ul className="mt-8 space-y-3">
          {projectsWithChat.map((p) => (
            <li key={p.id}>
              <Link to={`/app/projetos/${p.id}`} state={{ openChat: true }}>
                <Card
                  className={`overflow-hidden transition-shadow hover:shadow-soft ${
                    p.status === "CANCELLED" ? "border-muted bg-muted/30 opacity-90" : ""
                  }`}
                >
                  <CardContent className="flex flex-row items-center gap-4 p-4">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        p.status === "CANCELLED" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.role === "CLIENT" ? "Com: " : "Cliente: "}
                        {getOtherPartyName(p, user?.role === "CLIENT" ? "CLIENT" : "PROFESSIONAL")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {(byProject[p.id] ?? 0) > 0 && p.status !== "CANCELLED" && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {byProject[p.id]! > 99 ? "99+" : byProject[p.id]}
                        </span>
                      )}
                      <Badge
                        variant={p.status === "CANCELLED" ? "outline" : "secondary"}
                        className={p.status === "CANCELLED" ? "border-muted-foreground/50 text-muted-foreground" : ""}
                      >
                        {projectStatusLabel[p.status] ?? p.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
