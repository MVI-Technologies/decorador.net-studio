import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, getApiErrorMessage } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { User, Upload, Trash2 } from "lucide-react";
import { cn, formatPhone, toAbsoluteAvatarUrl } from "@/lib/utils";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getUserPhone(u: { phone?: string; phoneNumber?: string; telefone?: string; phone_number?: string } | null | undefined): string {
  if (!u) return "";
  const raw = u.phone ?? u.phoneNumber ?? u.telefone ?? (u as { phone_number?: string }).phone_number ?? "";
  return formatPhone(raw) || "";
}

function getAvatarUrl(user: { avatarUrl?: string; avatar_url?: string } | null | undefined): string | undefined {
  const src = user?.avatarUrl ?? (user as { avatar_url?: string })?.avatar_url;
  return toAbsoluteAvatarUrl(src);
}

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Perfil() {
  const { user, refreshMe, updateUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    refreshMe({ clearTokenOnError: false });
  }, [refreshMe]);

  const displayPhone = getUserPhone(user);
  const displayAvatarUrl = getAvatarUrl(user);

  const avatarPreviewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );
  useEffect(() => () => avatarPreviewUrl && URL.revokeObjectURL(avatarPreviewUrl), [avatarPreviewUrl]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name ?? "", phone: displayPhone });
    }
  }, [user?.id, user?.name, user?.phone, displayPhone, form]);

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Use imagem JPG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }
    setAvatarFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAvatarFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const getDigits = (s: string) => (s ?? "").replace(/\D/g, "");
      const hasAvatar = avatarFile !== null;
      const hasName = data.name !== user?.name;
      const hasPhone = getDigits(data.phone ?? "") !== getDigits(getUserPhone(user));
      if (!hasAvatar && !hasName && !hasPhone) return;

      let res;
      if (hasAvatar) {
        const formData = new FormData();
        formData.append("avatar", avatarFile!);
        if (hasName) formData.append("name", data.name);
        if (hasPhone) formData.append("phone", data.phone ?? "");
        res = await api.patch("/users/profile", formData, { skipAuthRedirect: true });
      } else {
        const body: { name?: string; phone?: string } = {};
        if (hasName) body.name = data.name;
        if (hasPhone) body.phone = data.phone ?? "";
        res = await api.patch("/users/profile", body, { skipAuthRedirect: true });
      }
      const payload = res.data?.data ?? res.data ?? {};
      const raw = (payload?.user ?? payload) as Record<string, unknown> | null;
      if (raw && typeof raw === "object") {
        const u = raw as Record<string, unknown>;
        updateUser({
          name: (u.name ?? user?.name) as string,
          phone: (u.phone ?? u.phoneNumber ?? u.telefone ?? u.phone_number ?? user?.phone) as string | undefined,
          avatarUrl: (u.avatarUrl ?? u.avatar_url ?? user?.avatarUrl) as string | undefined,
        });
      }
    },
    onSuccess: async () => {
      setAvatarFile(null);
      await refreshMe({ clearTokenOnError: false });
      toast.success("Perfil atualizado!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/users/avatar", { skipAuthRedirect: true });
      updateUser({ avatarUrl: undefined });
    },
    onSuccess: async () => {
      await refreshMe({ clearTokenOnError: false });
      toast.success("Foto removida.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

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
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_AVATAR_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={cn(
                "relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage
                  key={avatarPreviewUrl ?? displayAvatarUrl ?? "fallback"}
                  src={avatarPreviewUrl ?? displayAvatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {user.name?.slice(0, 2).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 transition-opacity hover:opacity-100">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">{user.role}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {avatarFile
                  ? "Foto selecionada. Clique em Salvar alterações."
                  : "Arraste uma foto ou clique para alterar (JPG, PNG, WebP ou GIF, máx. 2MB)"}
              </p>
              {displayAvatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-8 gap-1 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteAvatarMutation.mutate()}
                  disabled={deleteAvatarMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover foto
                </Button>
              )}
            </div>
          </div>

          <Form {...form} key={user?.id}>
            <form
              onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" className="rounded-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        className="rounded-full"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="rounded-full shadow-brand"
                disabled={updateMutation.isPending || (!avatarFile && !form.formState.isDirty)}
              >
                {updateMutation.isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </form>
          </Form>

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
