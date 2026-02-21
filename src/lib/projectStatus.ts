import type { ProjectStatus, PaymentStatus } from "@/types/api";

export const projectStatusLabel: Record<ProjectStatus, string> = {
  BRIEFING_SUBMITTED: "Briefing enviado",
  MATCHING: "Buscando decorador",
  PROFESSIONAL_ASSIGNED: "Aguardando aceite",
  IN_PROGRESS: "Em andamento",
  REVISION_REQUESTED: "Revisão solicitada",
  DELIVERED: "Entregue",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  IN_ESCROW: "Em escrow",
  RELEASED: "Liberado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

export const professionalStatusLabel: Record<string, string> = {
  PENDING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
};
