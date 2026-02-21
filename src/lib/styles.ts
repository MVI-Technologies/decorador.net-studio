/**
 * Estilos usados no briefing (cliente) e no perfil do profissional.
 * Mesma lista em ambos para o match funcionar.
 */
export const STYLE_OPTIONS = [
  "Moderno",
  "Minimalista",
  "Rústico",
  "Industrial",
  "Clássico",
  "Boho",
  "Tropical",
  "Escandinavo",
] as const;

export type StyleOption = (typeof STYLE_OPTIONS)[number];

/** Valor usado no briefing quando o cliente não quer filtrar por estilo. */
export const SEM_ESTILOS = "Sem estilos";

/** Opções para o cliente (inclui "Sem estilos"). */
export const styleOptionsForClient = [SEM_ESTILOS, ...STYLE_OPTIONS];
