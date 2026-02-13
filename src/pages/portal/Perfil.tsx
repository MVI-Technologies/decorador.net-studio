import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default function Perfil() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container py-8">
      <h1 className="text-display-md text-foreground">Meu perfil</h1>
      <p className="mt-2 text-muted-foreground">Dados da sua conta.</p>

      <Card className="mt-8 max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {user.name?.slice(0, 2).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">{user.role}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Para alterar nome, telefone ou avatar, use a API PATCH /users/profile. Em produção, adicione um formulário aqui.
          </p>
          {user.role === "PROFESSIONAL" && (
            <Button asChild className="rounded-full shadow-brand">
              <Link to="/app/meu-perfil">Editar perfil profissional</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
