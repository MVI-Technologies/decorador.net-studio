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

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explorar" className="transition-colors hover:text-primary">Explorar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/termos" className="transition-colors hover:text-primary">Termos de uso</Link></li>
              <li><Link to="/help" className="transition-colors hover:text-primary">Help Desk</Link></li>
              <li><Link to="/contato" className="transition-colors hover:text-primary">Contato</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Redes sociais</h4>
            <div className="flex gap-3">
              <a href="#" className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Decorador.net. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
