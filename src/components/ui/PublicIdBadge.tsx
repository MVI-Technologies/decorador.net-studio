import { cn } from "@/lib/utils";

interface PublicIdBadgeProps {
  id?: string | null;
  className?: string;
}

/**
 * Badge de identificação pública. Exibe IDs como #P001, #A001, #C001
 * com a cor principal (primary/brand) do design system.
 */
export function PublicIdBadge({ id, className }: PublicIdBadgeProps) {
  if (!id) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5",
        "text-xs font-semibold leading-none",
        "bg-primary/10 text-primary border-primary/20",
        "transition-colors select-none",
        className,
      )}
      title={`ID público: ${id}`}
    >
      {id}
    </span>
  );
}
