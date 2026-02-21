/* Decorador.net — API types */

export type Role = "CLIENT" | "PROFESSIONAL" | "ADMIN";

export type ProjectStatus =
  | "BRIEFING_SUBMITTED"
  | "MATCHING"
  | "PROFESSIONAL_ASSIGNED"
  | "IN_PROGRESS"
  | "REVISION_REQUESTED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type ProfessionalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";

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
  professionalProfileId?: string;
  briefing?: Briefing;
  payment?: Payment;
  /** Preenchido quando a API retorna dados do cliente (ex.: listagem admin). */
  client?: User;
  professionalProfile?: ProfessionalProfile;
  revisionCount?: number;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  sender?: User;
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
