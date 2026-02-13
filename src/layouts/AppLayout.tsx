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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, LayoutDashboard, Briefcase, User, LogOut, Wallet, Shield, KeyRound, Inbox, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = user ? getNav(user.role) : [];

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-md text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/app" className="flex items-center gap-1.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                d
              </span>
              <span className="hidden font-semibold text-foreground sm:inline">Decorador.net</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
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

        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="container flex flex-col gap-1 py-4">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
