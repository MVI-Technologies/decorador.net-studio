import type { ProjectStatus, PaymentStatus } from "@/types/api";

export const projectStatusLabel: Record<ProjectStatus, string> = {
  BRIEFING_SUBMITTED: "Briefing enviado",
  MATCHING: "Em busca de profissional",
  NEGOCIANDO: "Negociando",
  PROFESSIONAL_ASSIGNED: "Profissional atribuído",
  IN_PROGRESS: "Em andamento",
  REVISION_REQUESTED: "Revisão solicitada",
  DELIVERED: "Entregue",
  APPROVED: "Aprovado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Aguardando pagamento / confirmação de recebimento",
  IN_ESCROW: "Em escrow (admin recebeu; aguardando repasse ao profissional)",
  RELEASED: "Repassado ao profissional",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

export const professionalStatusLabel: Record<string, string> = {
  PENDING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
};
