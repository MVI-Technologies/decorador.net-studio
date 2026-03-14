/* Decorador.net — API types */

export type Role = "CLIENT" | "PROFESSIONAL" | "ADMIN";

export type ProjectStatus =
  | "BRIEFING_SUBMITTED"
  | "MATCHING"
  | "NEGOCIANDO"
  | "PROFESSIONAL_ASSIGNED"
  | "AWAITING_PAYMENT"
  | "IN_PROGRESS"
  | "REVISION_REQUESTED"
  | "DELIVERED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED";

/** Status do pagamento retornado pelo Mercado Pago */
export type MercadoPagoPaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type ProposalStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "NEGOTIATING";

export interface Proposal {
  id: string;
  projectId: string;
  professionalProfileId: string;
  price: number;
  packageType?: string;
  /** Prazo em dias (API pode devolver estimatedDays ou deadlineDays) */
  estimatedDays?: number;
  deadlineDays?: number;
  /** Observações (API pode devolver notes ou message) */
  notes?: string;
  message?: string;
  status: ProposalStatus;
  createdAt: string;
  professionalProfile?: Pick<ProfessionalProfile, "id" | "displayName"> & { user?: { name: string; avatarUrl?: string } };
}

export type ProfessionalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type ProfessionalSubscriptionStatus = "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED";

export type PaymentStatus = "PENDING" | "IN_ESCROW" | "RELEASED" | "REFUNDED" | "CANCELLED";

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";
export type WithdrawalStatus = "REQUESTED" | "PROCESSING" | "COMPLETED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  /** Se false, o usuário não pode fazer login. */
  isActive?: boolean;
}

export interface ClientProfile {
  id: string;
  userId: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  preferredStyles?: string[];
  onboardingCompleted?: boolean;
}

export interface Style {
  id: string;
  name: string;
  description?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  category?: string;
  order?: number;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  cpfCnpj?: string;
  documentUrl?: string;
  experienceYears?: number;
  city?: string;
  state?: string;
  status: ProfessionalStatus;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKey?: string;
  styles?: Style[];
  portfolioItems?: PortfolioItem[];
  user?: User;
  averageRating?: number;
  reviewCount?: number;
  subscriptionStatus?: ProfessionalSubscriptionStatus;
  subscriptionExpiresAt?: string;
}

export interface Briefing {
  id: string;
  projectId: string;
  projectTitle: string;
  roomType?: string;
  roomSize?: string;
  budget?: string;
  description?: string;
  stylePreferences?: string[];
  referenceImages?: string[];
  requirements?: string;
  deadline?: string;
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  clientId: string;

  /** ID do profissional selecionado pelo cliente (pós-negociação, antes do pagamento) */
  selectedProfessionalId?: string;
  selectedProfessional?: ProfessionalProfile;

  /** Preço acordado do projeto */
  price?: number;

  // ── Campos Mercado Pago ─────────────────────────────────────────────
  /** ID da preferência de pagamento criada no MP */
  paymentPreferenceId?: string;
  /** URL de checkout gerada pelo MP — redirecionar o cliente aqui */
  paymentCheckoutUrl?: string;

  /** ID do pagamento efetivado (após webhook de aprovação) */
  paymentId?: string;
  /** Status do pagamento (campo do MP) */
  paymentStatus?: MercadoPagoPaymentStatus;
  /** Método: 'pix' | 'credit_card' | 'debit_card' | 'account_money' */
  paymentMethod?: string;
  /** Número de parcelas (cartão de crédito) */
  installments?: number;
  /** Valor efetivamente transacionado */
  transactionAmount?: number;

  professionalProfileId?: string;
  briefing?: Briefing;
  payment?: Payment;
  /** Preenchido quando a API retorna dados do cliente (ex.: listagem admin). */
  client?: User;
  professionalProfile?: ProfessionalProfile;
  /** Propostas do projeto (GET /projects/:id pode retornar; senão usar GET /proposals/:projectId). */
  proposals?: Proposal[];
  revisionCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Tipos auxiliares do fluxo de seleção + pagamento ────────────────────────

/** Resposta de POST /projects/:id/select-professional */
export interface SelectProfessionalResponse {
  /** URL de checkout do Mercado Pago para redirecionar o cliente */
  checkoutUrl: string;
  /** ID da preferência gerada */
  paymentPreferenceId: string;
  project: Project;
}

/**
 * Profissional que possui conversa ativa no projeto.
 * Retornado por GET /projects/:id/chat-professionals
 */
export interface ChatProfessional {
  professionalProfileId: string;
  professionalProfile: ProfessionalProfile;
  /** Total de mensagens trocadas neste projeto */
  messageCount: number;
  /** Data da última mensagem */
  lastMessageAt: string;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number;
  fee?: number;
  status: PaymentStatus;
  platformFee?: number;
  professionalAmount?: number;
  createdAt?: string;
  escrowStartedAt?: string;
  releasedAt?: string | null;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  /** Path no bucket privado do chat; usado para obter signed URL quando o link expira */
  fileStoragePath?: string;
  createdAt: string;
  sender?: User;
}

/** Payload do evento newMessage (Socket.io). Backend deve enviar id para evitar duplicata no front. */
export interface NewMessagePayload {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  createdAt: string;
  fileUrl?: string;
  fileStoragePath?: string;
  sender?: { id: string; name?: string; role?: string };
}

export interface Review {
  id: string;
  projectId: string;
  professionalProfileId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  client?: User;
}

/** Resposta de GET /chat/unread-summary: quantos chats têm mensagens não lidas e por projeto */
export interface ChatUnreadSummary {
  /** Quantidade de conversas com pelo menos 1 mensagem não lida */
  chatsWithUnread: number;
  /** Por projectId: quantidade de mensagens não lidas (opcional; para badge por chat) */
  byProject?: Record<string, number>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  professionalProfileId: string;
  amount: number;
  status: WithdrawalStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthMeResponse {
  user: User;
  clientProfile?: ClientProfile;
  professionalProfile?: ProfessionalProfile;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
  role: "CLIENT" | "PROFESSIONAL";
  phone?: string;
}

export interface SigninBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

/** Resposta de GET /payments/project/:projectId/pix-info */
export interface PixInfoResponse {
  pixKey: string;
  pixKeyType: PixKeyType;
  amount: number;
  description: string;
  projectId: string;
  /** Payload PIX copia e cola (opcional; se presente, usado para gerar QR) */
  pixPayload?: string;
}

/** GET /admin/settings/pix */
export interface AdminPixSettings {
  pixKey?: string;
  pixKeyType?: PixKeyType;
}

/** Payment com dados extras para listagens admin */
export interface PaymentWithProject extends Payment {
  project?: Project;
}

/** Item retornado por GET /admin/payments/pending-transfer */
export interface PaymentPendingTransfer {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  professionalName: string;
  /** Chave PIX do profissional; null se não cadastrada */
  professionalPixKey: string | null;
  /** Valor total do projeto (pago pelo cliente) */
  totalAmount: number;
  /** Taxa da plataforma (ex.: 15%) */
  platformFee: number;
  /** Valor a repassar ao profissional (já descontada a taxa) */
  amountToTransfer: number;
  /** Data em que entrou em escrow */
  escrowStartedAt: string;
}

/** GET /admin/settings/platform */
export interface AdminPlatformSettings {
  professionalMonthlyFee: number;
  platformFeePercentage: number;
  maxInstallments?: number;
}

/** Resposta de GET /subscriptions/status */
export interface SubscriptionStatusResponse {
  status: ProfessionalSubscriptionStatus;
  expiresAt?: string;
}

/** Resposta de POST /subscriptions/subscribe */
export interface SubscribeResponse {
  checkoutUrl: string;
}
