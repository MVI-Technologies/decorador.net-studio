import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="text-lg font-bold tracking-tight">
              <span className="text-primary">decorador</span>
              <span className="text-muted-foreground">.net</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Marketplace de decoração online. Transforme seu ambiente com profissionais qualificados.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Decorador.net. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
