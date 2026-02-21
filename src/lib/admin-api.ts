/**
 * Endpoints do painel admin.
 * Prefixo global: baseURL (ex.: /api/v1). Todos exigem Bearer token (JWT) e role ADMIN.
 */

export const adminApi = {
  /** 1. Dashboard — GET /admin/dashboard */
  dashboard: "/admin/dashboard",

  /** 2. Chave PIX — GET/PATCH /admin/settings/pix */
  settingsPix: "/admin/settings/pix",

  /** 3. Aguard. recebimento — GET /admin/payments/pending-received */
  paymentsPendingReceived: "/admin/payments/pending-received",
  /** PATCH /admin/payments/:id/mark-received */
  paymentMarkReceived: (id: string) => `/admin/payments/${id}/mark-received`,

  /** 4. A repassar — GET /admin/payments/pending-transfer */
  paymentsPendingTransfer: "/admin/payments/pending-transfer",
  /** PATCH /admin/payments/:id/mark-paid-to-professional */
  paymentMarkPaidToProfessional: (id: string) => `/admin/payments/${id}/mark-paid-to-professional`,

  /** 5. Profissionais pendentes — GET /admin/professionals/pending */
  professionalsPending: "/admin/professionals/pending",
  /** PATCH /admin/professionals/:id/status — :id = ID do ProfessionalProfile */
  professionalStatus: (id: string) => `/admin/professionals/${id}/status`,

  /** 6. Saques pendentes — GET /admin/withdrawals/pending */
  withdrawalsPending: "/admin/withdrawals/pending",
  /** PATCH /admin/withdrawals/:id/process — :id = ID do saque */
  withdrawalProcess: (id: string) => `/admin/withdrawals/${id}/process`,

  /** 7. Usuários — GET /admin/users?page=1&limit=20 */
  users: "/admin/users",
  /** PATCH /admin/users/:id/toggle-active — :id = ID do usuário */
  userToggleActive: (id: string) => `/admin/users/${id}/toggle-active`,

  /** 8. Projetos (admin) — GET /admin/projects?page=1&limit=20 */
  projects: "/admin/projects",
} as const;
