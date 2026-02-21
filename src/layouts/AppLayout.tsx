import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LayoutDashboard, Briefcase, User, LogOut, Wallet, Shield, KeyRound, Inbox, ArrowRightCircle } from "lucide-react";
import { cn, toAbsoluteAvatarUrl } from "@/lib/utils";
import type { Role } from "@/types/api";

const clientNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/projetos", label: "Projetos", icon: Briefcase },
  { to: "/app/novo-briefing", label: "Novo briefing", icon: Briefcase },
];

const professionalNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/meu-perfil", label: "Meu perfil", icon: User },
  { to: "/app/projetos", label: "Projetos", icon: Briefcase },
  { to: "/app/pagamentos", label: "Pagamentos", icon: Wallet },
];

const adminNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/projetos-admin", label: "Projetos", icon: Briefcase },
  { to: "/app/configuracoes-pix", label: "Chave PIX", icon: KeyRound },
  { to: "/app/pagamentos-recebidos", label: "Aguard. recebimento", icon: Inbox },
  { to: "/app/pagamentos-repassar", label: "A repassar", icon: ArrowRightCircle },
  { to: "/app/profissionais-pendentes", label: "Profissionais", icon: User },
  { to: "/app/saques", label: "Saques", icon: Wallet },
  { to: "/app/usuarios", label: "Usuários", icon: Shield },
];

function getNav(role: Role) {
  if (role === "ADMIN") return adminNav;
  if (role === "PROFESSIONAL") return professionalNav;
  return clientNav;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = user ? getNav(user.role) : [];

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="sm:hidden flex shrink-0 items-center justify-center p-2 rounded-md text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/app" className="flex shrink-0 items-center gap-1.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                d
              </span>
              <span className="hidden font-semibold text-foreground sm:inline">Decorador.net</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1 overflow-x-auto py-1 min-w-0 flex-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app"}
                  className={({ isActive }) =>
                    cn(
                      "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={toAbsoluteAvatarUrl(user?.avatarUrl)} alt={user?.name} referrerPolicy="no-referrer" />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/app/perfil">Meu perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[min(320px,85vw)] flex flex-col p-0">
            <SheetHeader className="border-b border-border px-6 py-4 text-left">
              <SheetTitle className="text-base font-semibold">Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Sair
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
