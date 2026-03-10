import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Explorar", href: "/explorar" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight text-foreground">
          <span className="text-primary">decor</span>
          <span className="text-muted-foreground">.net</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Entrar
          </Link>
          <Button asChild size="sm" className="rounded-full px-6 shadow-brand">
            <Link to="/cadastro">Começar agora</Link>
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background transition-all duration-200 md:hidden",
          open ? "max-h-80" : "max-h-0"
        )}
      >
        <nav className="container flex flex-col gap-3 py-4">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Entrar
          </Link>
          <Button asChild size="sm" className="w-full rounded-full shadow-brand">
            <Link to="/cadastro" onClick={() => setOpen(false)}>
              Começar agora
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
