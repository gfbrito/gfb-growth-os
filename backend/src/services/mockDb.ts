/**
 * GFB Growth OS — In-Memory Mock Database & Seed Store
 * Permite que todo o sistema, APIs e frontend rodem de forma 100% autônoma
 * com dados reais e consistentes, sem necessidade de banco local ativo.
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "GESTOR" | "CLIENT";
  avatarUrl: string;
  organizationId: string;
}

import {
  BusinessType,
  ConversionRule,
  ConversionAuditLog,
  ConversionReviewQueueItem,
  createDefaultLocalBusinessRules,
} from "../modules/conversions/conversion.types.js";

export interface MockClient {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  revenueGoalCents: bigint;
  currentRevenueCents: bigint;
  todayRevenueCents: bigint;
  status: "ACTIVE" | "PAUSED";
  assignedGestorId: string;
  pixelKey: string;
  pixelId: string;
  businessType: BusinessType;
  conversionTrackingEnabled: boolean;
  simulationMode: boolean;
  wabaAccountId?: string;
  wabaDatasetId?: string;
  stages?: string[];
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "WAITING" | "AWAITING_APPROVAL" | "DONE";
export type TaskPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
export type TaskKind = "RECURRING" | "PROJECT";
export type TaskArea = "META_ADS" | "WHATSAPP" | "AUTOMATION" | "CREATIVE" | "SITE_LP" | "CRM" | "OTHER";
export type TaskVisibility = "INTERNAL" | "CLIENT";
export type TaskSource = "MANUAL" | "ROUTINE" | "SYSTEM";
export type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  weekday?: number; // 0 (Sun) - 6 (Sat)
  dayOfMonth?: number; // 1 - 31
  anchorDate: string; // "YYYY-MM-DD"
}

export interface MockRoutineTemplate {
  id: string;
  title: string;
  area: TaskArea;
  priority: TaskPriority;
  visibility: TaskVisibility;
  frequency: RecurrenceFrequency;
  weekday?: number;
  dayOfMonth?: number;
  defaultChecklists?: string[];
}

export interface MockTaskRoutine {
  id: string;
  name: string;
  description?: string;
  templates: MockRoutineTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface MockClientRoutineSubscription {
  clientId: string;
  routineId: string;
  enabled: boolean;
  assignedUserId?: string;
  seriesIds: string[];
}

export interface MockTaskChecklistItem {
  id: string;
  title: string;
  done: boolean;
  position?: number;
}

export interface MockTaskAttachment {
  id: string;
  title: string;
  url: string;
}

export interface MockTask {
  id: string;
  clientId?: string | null;
  title: string;
  descriptionMarkdown?: string;
  status: TaskStatus;
  priority: TaskPriority;
  kind?: TaskKind;
  area?: TaskArea;
  visibility?: TaskVisibility;
  source?: TaskSource;
  sourceRef?: string | null;
  assignedUserId?: string | null;
  dueDate?: string | null;
  waitingReason?: string | null;
  link?: string | null;
  checklists?: MockTaskChecklistItem[];
  attachments?: MockTaskAttachment[];
  timeEstimateMinutes?: number;
  timeSpentMinutes?: number;
  seriesId?: string | null;
  recurrence?: TaskRecurrence | null;
  seriesEndedAt?: string | null;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  deletedAt?: string | null;
}

export interface MockTaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface MockTaskHistoryEvent {
  id: string;
  taskId: string;
  type: string;
  from?: any;
  to?: any;
  authorName: string;
  createdAt: string;
}

export interface MockLeadAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface MockLead {
  id: string;
  clientId: string;
  name: string;
  email: string;
  secondaryEmails?: string[];
  phone: string; // E.164
  cpf?: string;
  birthDate?: string; // YYYY-MM-DD
  address?: MockLeadAddress;
  temperature: "HOT" | "WARM" | "COLD" | "INACTIVE";
  stage: "LEAD" | "BUYER" | "RECURRING" | "VIP" | string;
  rfmPoints: number;
  totalSpentCents: bigint;
  purchaseCount: number;
  lastSeen: string;
  firstSeen?: string;
  attributionSource?: string;
  tags?: string[];
  origin?: "ORGANIC" | "ADS" | "INDICATION" | "IMPORT" | "MANUAL";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  whatsappOptOut?: boolean;
  whatsappOptOutAt?: string;
  customFields?: Record<string, string | number | boolean>;
  // Rastreamento de Origem WhatsApp e Web
  originType?: "CLICK_TO_WHATSAPP" | "WEBSITE_CLICK" | "UNTRACKED";
  ctwaClid?: string;
  adId?: string;
  adTitle?: string;
  adBody?: string;
  clickTrackingCode?: string;
  fbp?: string;
  fbc?: string;
  currentCycle?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MockAutomationRule {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  triggerType: "ABANDONED_CART" | "PENDING_PIX_BOLETO" | "PAYMENT_REFUSED" | "NEW_LEAD" | "BIRTHDAY";
  isActive: boolean;
  delayMinutes: number;
  templateMessage: string;
  sentCount: number;
  convertedCount: number;
  createdAt?: string;
}

export interface MockSubscriptionItem {
  id: string;
  clientId: string;
  leadId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  planName: string;
  amountCents: bigint;
  status: "ACTIVE" | "RENEWAL_DUE" | "EXPIRED" | "CANCELED";
  currentPeriodEnd: string;
  autoRenew: boolean;
}

export interface MockOperationalNotification {
  id: string;
  clientId: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  leadId?: string;
}

export interface MockCrmSettings {
  clientId: string;
  rfmWeights: { recency: number; frequency: number; monetary: number };
  temperatureDays: { warmDays: number; coldDays: number; inactiveDays: number };
  webhookEndpoints: { kiwify: string; hotmart: string; eduzz: string };
  customFieldKeys: { key: string; label: string; type: "text" | "number" | "boolean" }[];
}

export interface MockOrder {
  id: string;
  clientId: string;
  leadName: string;
  leadEmail: string;
  productName: string;
  grossAmountCents: bigint;
  status: "CONFIRMED" | "PENDING" | "REFUNDED" | "CHARGEBACK";
  platform: "KIWIFY" | "HOTMART" | "EDUZZ" | "GENERIC";
  isAttributedToAds: boolean;
  adCampaignName?: string;
  createdAt: string;
  capiStatus: "SENT" | "PENDING" | "FAILED";
}

export interface MockWhatsAppInstance {
  id: string;
  clientId?: string;
  name: string;
  instanceKey: string;
  phone: string;
  status: "CONNECTED" | "DISCONNECTED" | "QR_READY" | "QUARANTINED";
  warmingScore: number;
  banRiskScore: number;
  dailySendCap: number;
  sentTodayCount: number;
  proxy?: string;
  lastActive?: string;
}

export type LaunchStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
export type LaunchFillOrder = "PROPORTIONAL" | "SEQUENTIAL";

export interface MockLaunch {
  id: string;
  clientId: string;
  name: string;
  slug: string;
  status: LaunchStatus;
  logoUrl?: string | null;
  description?: string;
  instanceKey?: string;
  memberLimitPerGroup: number;
  autoCreateEnabled: boolean;
  autoCreateThresholdPercent: number; // 1-100, padrão 90
  fillOrder: LaunchFillOrder;
  groupNamePattern: string; // "{nome} - Grupo {n}"
  groupDescription: string;
  metaPixelId?: string | null;
  gtmContainerId?: string | null;
  aiEnabled: boolean;
  aiSystemPrompt?: string;
  aiAutoReply: boolean;
  currentMembers: number;
  maxMembers: number;
  groupCount: number;
  totalLeads: number;
  conversionRatePct: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MockProduct {
  id: string;
  clientId: string;
  name: string;
  type: "DIGITAL" | "PHYSICAL" | "SUBSCRIPTION";
  priceCents: bigint;
  status: "ACTIVE" | "INACTIVE";
  salesCount: number;
  isSubscription?: boolean;
  renewalDays?: number;
  renewalLink?: string;
  externalPlatform?: string;
}

export interface MockRecoveryItem {
  id: string;
  clientId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  productName: string;
  amountCents: bigint;
  type: "ABANDONED_CART" | "PAYMENT_REFUSED" | "PENDING_PIX_BOLETO" | "REFUND";
  status: "PENDING" | "CONTACTED" | "RECOVERED" | "LOST";
  platform: "KIWIFY" | "HOTMART" | "EDUZZ";
  createdAt: string;
}

export interface MockChatMessage {
  id: string;
  sender: "CONTACT" | "AGENT" | "AI";
  text: string;
  time: string;
  status: "SENT" | "DELIVERED" | "READ";
}

export interface MockChatConversation {
  id: string;
  clientId: string;
  leadId: string | null;
  phone: string;
  contactName: string;
  contactPhone: string;
  chipKey: string;
  temperature: "HOT" | "WARM" | "COLD";
  stage: string;
  potentialCents: bigint;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  tags: string[];
  notes: string;
  messages: MockChatMessage[];
}

export interface MockLaunchGroup {
  id: string;
  launchId: string;
  name: string;
  number: number;
  memberCount: number;
  maxMembers: number;
  status: "RECEIVING" | "PAUSED" | "FULL";
  inviteUrl: string;
  whatsappGroupId: string;
  position: number;
  createdAt: string;
}
export type MockLaunchGroupItem = MockLaunchGroup;

export interface MockLaunchParticipant {
  id: string;
  launchId: string;
  phone: string;
  name?: string | null;
  crmLeadId?: string | null;
  groupIds: string[];
  status: "ACTIVE" | "LEFT" | "BLOCKED";
  engagementScore: number;
  classification: "HOT" | "WARM" | "COOL" | "COLD";
  joinedAt: string;
  leftAt?: string | null;
}

export interface MockLaunchClick {
  id: string;
  launchId: string;
  visitorId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  assignedGroupId?: string;
  createdAt: string;
}

export interface MockLaunchQueueItem {
  id: string;
  launchId: string;
  groupNumber: number;
  status: "PENDING" | "CREATING" | "DONE" | "FAILED";
  error?: string;
  createdAt: string;
  processedAt?: string;
}

export interface MockLaunchMessageDelivery {
  targetId: string;
  targetName?: string;
  status: "SENT" | "FAILED" | "SKIPPED";
  sentAt?: string;
  error?: string;
}

export interface MockLaunchMessage {
  id: string;
  launchId: string;
  title: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "POLL";
  content: string;
  mediaUrl?: string | null;
  pollOptions?: string[];
  pollMaxAnswers?: number;
  scheduledAt?: string | null;
  status: "SCHEDULED" | "SENDING" | "SENT" | "PARTIAL" | "FAILED" | "CANCELED";
  targetType: "ALL_GROUPS" | "SELECTED_GROUPS" | "PRIVATE_ACTIVE_LEADS";
  selectedGroupIds?: string[];
  mentionAll?: boolean;
  linkPreview?: boolean;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  deliveries?: MockLaunchMessageDelivery[];
  createdAt: string;
  updatedAt?: string;
}

export interface MockLaunchScheduledGroupAction {
  id: string;
  launchId: string;
  type: "CHANGE_NAME" | "CHANGE_DESCRIPTION" | "CHANGE_PHOTO" | "LOCK_MESSAGES" | "UNLOCK_MESSAGES";
  payload: string;
  scheduledAt: string;
  applyToFuture: boolean;
  applyToAllGroups: boolean;
  selectedGroupIds?: string[];
  status: "SCHEDULED" | "EXECUTED" | "CANCELED";
  executedAt?: string;
  results?: Array<{ groupId: string; status: "SUCCESS" | "FAILED"; error?: string }>;
  createdAt: string;
}

export interface MockLaunchInboxMessage {
  id: string;
  launchId: string;
  participantPhone: string;
  participantName?: string;
  origin: "GROUP" | "PRIVATE";
  groupId?: string;
  messageText: string;
  status: "PENDING" | "SENT" | "REJECTED" | "IGNORED";
  suggestedReply?: string;
  confidencePercent?: number;
  isAutoReplied?: boolean;
  replyText?: string;
  receivedAt: string;
  repliedAt?: string;
}

export interface MockLaunchWebhook {
  id: string;
  launchId: string;
  name: string;
  targetUrl: string;
  events: Array<"LEAD_JOINED" | "LEAD_LEFT" | "GROUP_CREATED" | "MESSAGE_SENT">;
  secret: string;
  enabled: boolean;
  createdAt: string;
}

export interface MockLaunchWebhookDelivery {
  id: string;
  webhookId: string;
  launchId: string;
  event: string;
  status: number;
  occurredAt: string;
  payload: any;
}

class MockDataStore {
  public organization = {
    id: "org_gfb_digital",
    name: "GFB Digital",
    slug: "gfb-digital",
    plan: "ENTERPRISE",
  };

  public users: MockUser[] = [
    {
      id: "usr_gisley",
      name: "Gisley Fernandes",
      email: "gisley@gfbdigital.com.br",
      role: "OWNER",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gisley",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_gestor",
      name: "Arthur Gestor",
      email: "gestor@gfbdigital.com.br",
      role: "GESTOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arthur",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_lucas",
      name: "Lucas Rocha",
      email: "lucas@gfbdigital.com.br",
      role: "GESTOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_mariana",
      name: "Mariana Silva",
      email: "mariana@gfbdigital.com.br",
      role: "GESTOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_rafael",
      name: "Rafael Costa",
      email: "rafael@gfbdigital.com.br",
      role: "GESTOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_carlos",
      name: "Carlos Atendente",
      email: "carlos@gfbdigital.com.br",
      role: "CLIENT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_bruna",
      name: "Bruna Ortiz",
      email: "cliente@brunaortiz.com.br",
      role: "CLIENT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruna",
      organizationId: "org_gfb_digital",
    },
  ];

  public clients: MockClient[] = [
    {
      id: "cli_bruna_ppp",
      organizationId: "org_gfb_digital",
      name: "Bruna Ortiz - PPP",
      slug: "brunaortiz_ppp",
      revenueGoalCents: BigInt(15000000), // R$ 150.000,00
      currentRevenueCents: BigInt(8740000), // R$ 87.400,00
      todayRevenueCents: BigInt(897000), // R$ 8.970,00 hoje
      status: "ACTIVE",
      assignedGestorId: "usr_gestor",
      pixelKey: "brunaortiz_ppp",
      pixelId: "123456789012345",
      businessType: "INFOPRODUTOR",
      conversionTrackingEnabled: false,
      simulationMode: true,
    },
    {
      id: "cli_theodoro",
      organizationId: "org_gfb_digital",
      name: "Theodoro Cursos Presenciais",
      slug: "theodoro_cursospresenciais",
      revenueGoalCents: BigInt(20000000), // R$ 200.000,00
      currentRevenueCents: BigInt(14200000), // R$ 142.000,00
      todayRevenueCents: BigInt(1250000), // R$ 12.500,00 hoje
      status: "ACTIVE",
      assignedGestorId: "usr_gisley",
      pixelKey: "theodoro_cursospresenciais",
      pixelId: "987654321098765",
      businessType: "INFOPRODUTOR",
      conversionTrackingEnabled: false,
      simulationMode: true,
    },
    {
      id: "cli_sorriso_local",
      organizationId: "org_gfb_digital",
      name: "Clínica Sorriso & Estética",
      slug: "clinica_sorriso_local",
      revenueGoalCents: BigInt(8000000), // R$ 80.000,00
      currentRevenueCents: BigInt(3450000), // R$ 34.500,00
      todayRevenueCents: BigInt(450000), // R$ 4.500,00 hoje
      status: "ACTIVE",
      assignedGestorId: "usr_gestor",
      pixelKey: "clinica_sorriso_local",
      pixelId: "445566778899001",
      businessType: "NEGOCIO_LOCAL",
      conversionTrackingEnabled: true,
      simulationMode: true,
      wabaAccountId: "waba_act_sorriso_01",
      wabaDatasetId: "waba_ds_sorriso_01",
      stages: ["Novo Lead", "Em Atendimento", "Qualificado", "Proposta", "Venda", "Perdido"],
    },
  ];

  public tasks: MockTask[] = [
    {
      id: "tsk_1",
      clientId: "cli_bruna_ppp",
      title: "Verificação e Blindagem do CAPI (Meta Graph API)",
      descriptionMarkdown: "Validar Event Match Quality (EMQ) nos eventos de PageView e Purchase para alcançar 8.9+.",
      status: "DONE",
      priority: "URGENT",
      kind: "PROJECT",
      area: "META_ADS",
      visibility: "CLIENT",
      source: "MANUAL",
      assignedUserId: "usr_gestor",
      dueDate: "2026-09-28",
      timeEstimateMinutes: 60,
      timeSpentMinutes: 55,
      createdByUserId: "usr_gisley",
      createdAt: "2026-09-25T10:00:00Z",
      updatedAt: "2026-09-28T18:00:00Z",
      completedAt: "2026-09-28T18:00:00Z",
      checklists: [
        { id: "chk_1", title: "Validar snippet v3.0 no site do cliente", done: true, position: 0 },
        { id: "chk_2", title: "Conferir envio de _fbp e _fbc nos eventos de compra", done: true, position: 1 },
        { id: "chk_3", title: "Checar se EMQ atingiu 8.8+ no painel Meta Ads", done: true, position: 2 },
      ],
    },
    {
      id: "tsk_2",
      clientId: "cli_bruna_ppp",
      title: "Configurar Instância de WhatsApp e SendGate Anti-Ban",
      descriptionMarkdown: "Conectar instância Evolution API v2 e inicializar aquecimento matemático com cronotipo padrão.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      kind: "PROJECT",
      area: "WHATSAPP",
      visibility: "CLIENT",
      source: "MANUAL",
      assignedUserId: "usr_gestor",
      dueDate: "2026-09-29",
      timeEstimateMinutes: 45,
      timeSpentMinutes: 20,
      createdByUserId: "usr_gisley",
      createdAt: "2026-09-26T10:00:00Z",
      updatedAt: "2026-09-29T14:00:00Z",
      checklists: [
        { id: "chk_4", title: "Ler QR Code da instância oficial", done: true, position: 0 },
        { id: "chk_5", title: "Configurar pacing gaussiano (15s a 45s de delay)", done: true, position: 1 },
        { id: "chk_6", title: "Ativar pausa preventiva caso o chip desconecte", done: false, position: 2 },
      ],
    },
    {
      id: "tsk_3",
      clientId: "cli_bruna_ppp",
      title: "Subir Criativos com Legenda Rápida 9:16",
      descriptionMarkdown: "Gerar 5 variações com palavras destacadas e corte seco de silêncio para a campanha de escala.",
      status: "TODO",
      priority: "NORMAL",
      kind: "PROJECT",
      area: "CREATIVE",
      visibility: "CLIENT",
      source: "MANUAL",
      assignedUserId: "usr_lucas",
      dueDate: "2026-09-30",
      timeEstimateMinutes: 120,
      timeSpentMinutes: 0,
      createdByUserId: "usr_gisley",
      createdAt: "2026-09-27T10:00:00Z",
      updatedAt: "2026-09-27T10:00:00Z",
      checklists: [
        { id: "chk_7", title: "Subir 5 vídeos 4K brutos via upload em chunks", done: false, position: 0 },
        { id: "chk_8", title: "Revisar cortes de silêncio no waveform", done: false, position: 1 },
        { id: "chk_9", title: "Exportar reels 1080x1920 com karaoke cyan", done: false, position: 2 },
      ],
    },
    {
      id: "tsk_4",
      clientId: "cli_bruna_ppp",
      title: "Ativar Régua de Recuperação de Carrinho e PIX Pendente",
      descriptionMarkdown: "Webhook Kiwify conectado com fechamento automático da recuperação ao aprovar compra.",
      status: "TODO",
      priority: "HIGH",
      kind: "PROJECT",
      area: "CRM",
      visibility: "CLIENT",
      source: "MANUAL",
      assignedUserId: "usr_gestor",
      dueDate: "2026-10-01",
      timeEstimateMinutes: 90,
      timeSpentMinutes: 0,
      createdByUserId: "usr_gisley",
      createdAt: "2026-09-28T10:00:00Z",
      updatedAt: "2026-09-28T10:00:00Z",
      checklists: [
        { id: "chk_10", title: "Configurar webhook de carrinho abandonado Kiwify", done: true, position: 0 },
        { id: "chk_11", title: "Aplicar janela de 24h anti-duplicação", done: true, position: 1 },
        { id: "chk_12", title: "Disparar mensagem personalizada com cupom dinâmico", done: false, position: 2 },
      ],
    },
    {
      id: "tsk_5",
      clientId: "cli_theodoro",
      title: "Planejamento de Lançamento Meteórico (SendFlow)",
      descriptionMarkdown: "Estruturar links dinâmicos /l/theodoro-turma-5 com grupos do WhatsApp e Telegram.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      kind: "PROJECT",
      area: "WHATSAPP",
      visibility: "CLIENT",
      source: "MANUAL",
      assignedUserId: "usr_gisley",
      dueDate: "2026-09-27",
      timeEstimateMinutes: 180,
      timeSpentMinutes: 90,
      createdByUserId: "usr_gisley",
      createdAt: "2026-09-25T11:00:00Z",
      updatedAt: "2026-09-27T15:00:00Z",
    },
    {
      id: "tsk_6",
      clientId: null,
      title: "Alinhamento Interno de Infraestrutura e CAPI Gateway",
      descriptionMarkdown: "Revisão dos clusters Redis e balanceamento do CAPI da agência.",
      status: "TODO",
      priority: "NORMAL",
      kind: "PROJECT",
      area: "OTHER",
      visibility: "INTERNAL",
      source: "MANUAL",
      assignedUserId: "usr_gisley",
      dueDate: new Date().toISOString().split("T")[0],
      timeEstimateMinutes: 30,
      timeSpentMinutes: 0,
      createdByUserId: "usr_gisley",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  public timeTrackingEnabled: boolean = false;

  public taskComments: MockTaskComment[] = [
    {
      id: "cmt_1",
      taskId: "tsk_1",
      authorId: "usr_gestor",
      authorName: "Arthur Gestor",
      body: "Pixel CAPI v3.0 validado e com EMQ de 9.1 registrado.",
      internal: false,
      createdAt: "2026-09-28T14:30:00.000Z",
    },
    {
      id: "cmt_2",
      taskId: "tsk_1",
      authorId: "usr_gisley",
      authorName: "Gisley Fernandes",
      body: "Excelente! Dados prontos para o cliente verificar.",
      internal: true,
      createdAt: "2026-09-28T15:00:00.000Z",
    },
  ];

  public taskHistory: MockTaskHistoryEvent[] = [
    {
      id: "his_1",
      taskId: "tsk_1",
      type: "CREATED",
      authorName: "Gisley Fernandes",
      createdAt: "2026-09-25T10:00:00.000Z",
    },
    {
      id: "his_2",
      taskId: "tsk_1",
      type: "STATUS_CHANGED",
      from: "TODO",
      to: "DONE",
      authorName: "Arthur Gestor",
      createdAt: "2026-09-28T18:00:00.000Z",
    },
  ];

  public taskRoutines: MockTaskRoutine[] = [
    {
      id: "rtn_meta_ads",
      name: "Gestão Operacional de Meta Ads",
      description: "Rotina operacional semanal de otimização de campanhas, verificação de CAPI e emissão de relatório de ROAS.",
      templates: [
        {
          id: "tpl_meta_otimizacao",
          title: "Otimização de Campanhas e Públicos Meta Ads",
          area: "META_ADS",
          priority: "HIGH",
          visibility: "INTERNAL",
          frequency: "WEEKLY",
          weekday: 1, // Segunda-feira
          defaultChecklists: [
            "Pausar anúncios com CPA acima da meta",
            "Remanejar verba para criativos com melhor retenção",
            "Verificar Event Match Quality (EMQ) no Events Manager",
          ],
        },
        {
          id: "tpl_meta_relatorio",
          title: "Relatório Semanal de Desempenho e ROAS",
          area: "META_ADS",
          priority: "NORMAL",
          visibility: "CLIENT",
          frequency: "WEEKLY",
          weekday: 5, // Sexta-feira
          defaultChecklists: [
            "Consolidar investimento e faturamento da semana",
            "Calcular métricas-chave (ROAS, CPA, CPC, CPM)",
            "Enviar resumo executivo para o cliente",
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "rtn_whatsapp",
      name: "Rotina Semanal de WhatsApp & Aquecimento",
      description: "Rotina semanal de verificação de chips, disparos preventivos e monitoramento de alertas anti-ban.",
      templates: [
        {
          id: "tpl_wpp_chips",
          title: "Check de Instâncias e Aquecimento WhatsApp",
          area: "WHATSAPP",
          priority: "URGENT",
          visibility: "INTERNAL",
          frequency: "WEEKLY",
          weekday: 1, // Segunda-feira
          defaultChecklists: [
            "Conferir status de conexão de todas as instâncias Evolution API",
            "Verificar fila de mensagens e taxas de entrega",
            "Ajustar delay e volume caso haja aumento de denúncias",
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  public clientRoutineSubscriptions: MockClientRoutineSubscription[] = [];

  public orders: MockOrder[] = [
    {
      id: "ord_101",
      clientId: "cli_bruna_ppp",
      leadName: "Camila Ribeiro",
      leadEmail: "camila.ribeiro@gmail.com",
      productName: "Programa Primeira Página (PPP)",
      grossAmountCents: BigInt(99700),
      status: "CONFIRMED",
      platform: "KIWIFY",
      isAttributedToAds: true,
      adCampaignName: "[CBO] Escala - Criativo 03 - Vídeo Legenda",
      createdAt: "2026-09-25T09:12:00Z",
      capiStatus: "SENT",
    },
    {
      id: "ord_102",
      clientId: "cli_bruna_ppp",
      leadName: "Rodrigo Silveira",
      leadEmail: "rodrigo.s@hotmail.com",
      productName: "Programa Primeira Página (PPP) + Bump Mentor",
      grossAmountCents: BigInt(149400),
      status: "CONFIRMED",
      platform: "KIWIFY",
      isAttributedToAds: true,
      adCampaignName: "[ABO] Remarketing WhatsApp",
      createdAt: "2026-09-25T08:45:00Z",
      capiStatus: "SENT",
    },
    {
      id: "ord_103",
      clientId: "cli_bruna_ppp",
      leadName: "Juliana Santos",
      leadEmail: "juliana.santos@outlook.com",
      productName: "Programa Primeira Página (PPP)",
      grossAmountCents: BigInt(99700),
      status: "PENDING",
      platform: "KIWIFY",
      isAttributedToAds: true,
      adCampaignName: "[CBO] Escala - Criativo 01",
      createdAt: "2026-09-25T08:15:00Z",
      capiStatus: "PENDING",
    },
    {
      id: "ord_104",
      clientId: "cli_theodoro",
      leadName: "Felipe Andrade",
      leadEmail: "felipe.andrade@empresa.com.br",
      productName: "Imersão Presencial São Paulo",
      grossAmountCents: BigInt(299700),
      status: "CONFIRMED",
      platform: "HOTMART",
      isAttributedToAds: true,
      adCampaignName: "[Lançamento] Convite Grupo VIP",
      createdAt: "2026-09-25T07:30:00Z",
      capiStatus: "SENT",
    },
  ];

  public leads: MockLead[] = [
    {
      id: "lead_1",
      clientId: "cli_bruna_ppp",
      name: "Camila Ribeiro",
      email: "camila.ribeiro@gmail.com",
      secondaryEmails: ["camila.clinica@gmail.com"],
      phone: "+5511987654321",
      cpf: "123.456.789-00",
      birthDate: "1994-06-18",
      address: {
        street: "Av. Paulista",
        number: "1000",
        complement: "Apto 42",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
      },
      temperature: "HOT",
      stage: "BUYER",
      rfmPoints: 120,
      totalSpentCents: BigInt(99700),
      purchaseCount: 1,
      lastSeen: "2026-09-25T09:12:00Z",
      attributionSource: "Meta Ads (CAPI)",
      tags: ["Aluno", "PPP", "Mentoria"],
      origin: "ADS",
      whatsappOptOut: false,
      customFields: {
        instagram: "@dracamilaribeiro",
        nicho: "Acupuntura Estética",
      },
      createdAt: "2026-08-10T14:00:00Z",
    },
    {
      id: "lead_2",
      clientId: "cli_bruna_ppp",
      name: "Rodrigo Silveira",
      email: "rodrigo.s@hotmail.com",
      phone: "+5521998877665",
      cpf: "987.654.321-11",
      birthDate: "1988-10-07",
      address: {
        street: "Rua Barata Ribeiro",
        number: "500",
        neighborhood: "Copacabana",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "22041-001",
      },
      temperature: "HOT",
      stage: "VIP",
      rfmPoints: 310,
      totalSpentCents: BigInt(349000),
      purchaseCount: 3,
      lastSeen: "2026-09-25T08:45:00Z",
      attributionSource: "WhatsApp Direct",
      tags: ["VIP", "Recorrente", "PPP"],
      origin: "INDICATION",
      whatsappOptOut: false,
      customFields: {
        instagram: "@rodrigo.acupuntura",
        nicho: "MTC Geral",
      },
      createdAt: "2026-06-01T10:00:00Z",
    },
    {
      id: "lead_3",
      clientId: "cli_bruna_ppp",
      name: "Juliana Santos",
      email: "juliana.santos@outlook.com",
      phone: "+5531991234567",
      cpf: "345.678.901-22",
      birthDate: "1997-12-25",
      address: {
        street: "Av. Afonso Pena",
        number: "1200",
        neighborhood: "Centro",
        city: "Belo Horizonte",
        state: "MG",
        zipCode: "30130-110",
      },
      temperature: "WARM",
      stage: "LEAD",
      rfmPoints: 35,
      totalSpentCents: BigInt(0),
      purchaseCount: 0,
      lastSeen: "2026-09-25T08:15:00Z",
      attributionSource: "Meta Ads (PIX Pendente)",
      tags: ["Lead", "Checkout"],
      origin: "ADS",
      whatsappOptOut: false,
      createdAt: "2026-09-20T11:00:00Z",
    },
    {
      id: "lead_4",
      clientId: "cli_bruna_ppp",
      name: "Carla Pombo",
      email: "carla.pombo@yahoo.com.br",
      phone: "+5521976543210",
      birthDate: "1991-03-20",
      address: {
        city: "Niterói",
        state: "RJ",
      },
      temperature: "HOT",
      stage: "LEAD",
      rfmPoints: 85,
      totalSpentCents: BigInt(0),
      purchaseCount: 0,
      lastSeen: "2026-09-25T11:42:00Z",
      attributionSource: "Kiwify Checkout",
      tags: ["VIP", "Quente", "Kiwify"],
      origin: "ORGANIC",
      whatsappOptOut: false,
      createdAt: "2026-09-22T08:00:00Z",
    },
    {
      id: "lead_5",
      clientId: "cli_bruna_ppp",
      name: "Deuseli Q de Figueiredo Souza",
      email: "deuseli.souza@gmail.com",
      phone: "+5561998765432",
      temperature: "WARM",
      stage: "LEAD",
      rfmPoints: 60,
      totalSpentCents: BigInt(0),
      purchaseCount: 0,
      lastSeen: "2026-09-25T10:15:00Z",
      attributionSource: "Kiwify Abandon",
      tags: ["Carrinho", "Moxaterapia"],
      origin: "ADS",
      whatsappOptOut: false,
      createdAt: "2026-09-24T18:00:00Z",
    },
  ];

  public automations: MockAutomationRule[] = [
    {
      id: "auto_1",
      clientId: "cli_bruna_ppp",
      title: "Recuperação de PIX / Boleto Pendente",
      description: "Dispara automaticamente após checkout PIX pendente para aumentar taxa de pagamento.",
      triggerType: "PENDING_PIX_BOLETO",
      isActive: true,
      delayMinutes: 15,
      templateMessage: "Olá *{primeiro_nome}*, vi que seu pedido de *{produto}* no valor de *R$ {valor}* gerou um PIX pendente. ⚡\n\nPosso te enviar a chave PIX copia-e-cola ou tirar alguma dúvida para te ajudar?",
      sentCount: 142,
      convertedCount: 38,
      createdAt: "2026-08-10",
    },
    {
      id: "auto_2",
      clientId: "cli_bruna_ppp",
      title: "Recuperação de Carrinho Abandonado",
      description: "Detecta abandono de carrinho na plataforma e aborda o lead com suporte e cupom.",
      triggerType: "ABANDONED_CART",
      isActive: true,
      delayMinutes: 30,
      templateMessage: "Olá *{primeiro_nome}*, notamos que você não concluiu a inscrição no *{produto}*! 🛒\n\nFicou alguma dúvida sobre o método ou sobre os bônus exclusivos da turma? Me avise por aqui!",
      sentCount: 98,
      convertedCount: 24,
      createdAt: "2026-08-15",
    },
    {
      id: "auto_3",
      clientId: "cli_bruna_ppp",
      title: "Recuperação de Cartão Recusado",
      description: "Aborda clientes com recusa de transação no cartão oferecendo pagamento alternativo.",
      triggerType: "PAYMENT_REFUSED",
      isActive: true,
      delayMinutes: 5,
      templateMessage: "Oi *{primeiro_nome}*, tudo bem? Notamos que o banco emissor não aprovou a transação do *{produto}*. 💳\n\nGostaria de tentar outro cartão de crédito ou podemos gerar um *PIX parcelado* sem juros?",
      sentCount: 45,
      convertedCount: 19,
      createdAt: "2026-08-18",
    },
    {
      id: "auto_4",
      clientId: "cli_bruna_ppp",
      title: "Boas-Vindas ao Novo Aluno / Lead",
      description: "Mensagem de boas-vindas e entrega de materiais iniciais imediatamente após cadastro.",
      triggerType: "NEW_LEAD",
      isActive: true,
      delayMinutes: 0,
      templateMessage: "Seja muito bem-vindo(a), *{primeiro_nome}*! 🚀\n\nSeu acesso aos nossos conteúdos da *Dra. Bruna Ortiz* já está liberado. Salve este contato na sua agenda para não perder as aulas ao vivo!",
      sentCount: 310,
      convertedCount: 88,
      createdAt: "2026-08-01",
    },
    {
      id: "auto_5",
      clientId: "cli_bruna_ppp",
      title: "Felicitações de Aniversário Especial",
      description: "Disparo no dia do aniversário com mensagem personalizada e cupom exclusivo.",
      triggerType: "BIRTHDAY",
      isActive: true,
      delayMinutes: 0,
      templateMessage: "Parabéns, *{primeiro_nome}*! 🎉🎂\n\nEm comemoração ao seu aniversário hoje, a Dra. Bruna preparou um presente especial: use o cupom *NIVERVIP* e garanta *20% de desconto* em qualquer formação da nossa esteira!",
      sentCount: 12,
      convertedCount: 5,
      createdAt: "2026-09-01",
    },
  ];

  public subscriptions: MockSubscriptionItem[] = [
    {
      id: "sub_1",
      clientId: "cli_bruna_ppp",
      leadId: "lead_1",
      customerName: "Camila Ribeiro",
      customerPhone: "+5511987654321",
      customerEmail: "camila.ribeiro@gmail.com",
      planName: "Acupuntura Master Anual",
      amountCents: BigInt(99700),
      status: "ACTIVE",
      currentPeriodEnd: "2027-09-25",
      autoRenew: true,
    },
    {
      id: "sub_2",
      clientId: "cli_bruna_ppp",
      leadId: "lead_2",
      customerName: "Rodrigo Silveira",
      customerPhone: "+5521998877665",
      customerEmail: "rodrigo.s@hotmail.com",
      planName: "Comunidade MTC Prime Mensal",
      amountCents: BigInt(9700),
      status: "RENEWAL_DUE",
      currentPeriodEnd: "2026-10-14",
      autoRenew: true,
    },
    {
      id: "sub_3",
      clientId: "cli_bruna_ppp",
      customerName: "Mariana Prado",
      customerPhone: "+5511977778888",
      customerEmail: "mariana.prado@gmail.com",
      planName: "Acupuntura Master Anual",
      amountCents: BigInt(99700),
      status: "EXPIRED",
      currentPeriodEnd: "2026-09-15",
      autoRenew: false,
    },
    {
      id: "sub_4",
      clientId: "cli_bruna_ppp",
      customerName: "Carlos Eduardo",
      customerPhone: "+5531988881234",
      customerEmail: "carlos.edu@terra.com.br",
      planName: "Comunidade MTC Prime Mensal",
      amountCents: BigInt(9700),
      status: "CANCELED",
      currentPeriodEnd: "2026-08-01",
      autoRenew: false,
    },
  ];

  public notifications: MockOperationalNotification[] = [
    {
      id: "notif_1",
      clientId: "cli_bruna_ppp",
      title: "Chip de contingência aquecendo",
      severity: "INFO",
      message: "O chip aqc_bruna_01 atingiu 84 pontos de score e já está seguro para 80 envios/dia.",
      isRead: false,
      createdAt: "2026-10-07T09:30:00Z",
    },
    {
      id: "notif_2",
      clientId: "cli_bruna_ppp",
      title: "Carrinho abandonado de alto valor",
      severity: "WARNING",
      message: "Deuseli Q abandonou pedido de R$ 497,00 (Método Diagnóstico 360°). Abordagem recomendada no chat.",
      isRead: false,
      createdAt: "2026-10-07T08:15:00Z",
      leadId: "lead_5",
    },
    {
      id: "notif_3",
      clientId: "cli_bruna_ppp",
      title: "Aniversariante do dia identificado",
      severity: "INFO",
      message: "Rodrigo Silveira faz aniversário hoje! Automação de cupom especial agendada para disparo.",
      isRead: true,
      createdAt: "2026-10-07T06:00:00Z",
      leadId: "lead_2",
    },
  ];

  public crmSettings: MockCrmSettings = {
    clientId: "cli_bruna_ppp",
    rfmWeights: { recency: 40, frequency: 30, monetary: 30 },
    temperatureDays: { warmDays: 14, coldDays: 45, inactiveDays: 90 },
    webhookEndpoints: {
      kiwify: "https://api.gfbdigital.com.br/api/webhooks/kiwify",
      hotmart: "https://api.gfbdigital.com.br/api/webhooks/hotmart",
      eduzz: "https://api.gfbdigital.com.br/api/webhooks/eduzz",
    },
    customFieldKeys: [
      { key: "instagram", label: "Instagram (@)", type: "text" },
      { key: "nicho", label: "Especialidade / Nicho", type: "text" },
      { key: "faturamento", label: "Faturamento Estimado", type: "text" },
    ],
  };

  public whatsappInstances: MockWhatsAppInstance[] = [
    {
      id: "inst_1",
      name: "WhatsApp Oficial GFB",
      instanceKey: "gfb_master_01",
      phone: "+5511999990001",
      status: "CONNECTED",
      warmingScore: 92,
      banRiskScore: 4,
      dailySendCap: 150,
      sentTodayCount: 42,
    },
    {
      id: "inst_2",
      name: "Atendimento Bruna Ortiz",
      instanceKey: "aqc_bruna_01",
      phone: "+5511999990002",
      status: "CONNECTED",
      warmingScore: 84,
      banRiskScore: 8,
      dailySendCap: 80,
      sentTodayCount: 26,
    },
  ];

  public launches: MockLaunch[] = [
    {
      id: "lnc_1",
      clientId: "cli_bruna_ppp",
      name: "Lançamento Meteórico Bruna - Turma Outubro",
      slug: "bruna-outubro",
      status: "ACTIVE",
      logoUrl: null,
      description: "Captação oficial para a Turma de Outubro do PPP.",
      instanceKey: "aqc_bruna_01",
      memberLimitPerGroup: 1000,
      autoCreateEnabled: true,
      autoCreateThresholdPercent: 90,
      fillOrder: "PROPORTIONAL",
      groupNamePattern: "{nome} - Grupo {n}",
      groupDescription: "Grupo VIP oficial exclusivo de avisos e links de aulas.",
      metaPixelId: "123456789012345",
      gtmContainerId: "GTM-GFB001",
      aiEnabled: true,
      aiSystemPrompt: "Você é a assistente oficial da Bruna Ortiz.",
      aiAutoReply: false,
      currentMembers: 984,
      maxMembers: 1024,
      groupCount: 4,
      totalLeads: 984,
      conversionRatePct: 14.8,
      createdAt: "2026-09-15T10:00:00.000Z",
      updatedAt: "2026-10-07T12:00:00.000Z",
    },
    {
      id: "lnc_2",
      clientId: "cli_theodoro",
      name: "Imersão Presencial VIP",
      slug: "theodoro-presencial",
      status: "ACTIVE",
      logoUrl: null,
      description: "Grupos VIP da imersão presencial de São Paulo.",
      instanceKey: "gfb_master_01",
      memberLimitPerGroup: 1000,
      autoCreateEnabled: true,
      autoCreateThresholdPercent: 90,
      fillOrder: "SEQUENTIAL",
      groupNamePattern: "{nome} - Grupo {n}",
      groupDescription: "Imersão exclusiva para profissionais.",
      metaPixelId: null,
      gtmContainerId: null,
      aiEnabled: false,
      aiAutoReply: false,
      currentMembers: 1420,
      maxMembers: 2000,
      groupCount: 2,
      totalLeads: 1420,
      conversionRatePct: 22.4,
      createdAt: "2026-09-20T10:00:00.000Z",
      updatedAt: "2026-10-07T12:00:00.000Z",
    },
  ];

  public products: MockProduct[] = [
    {
      id: "prd_1",
      clientId: "cli_bruna_ppp",
      name: "Curso Online 10 pontos, 50 soluções",
      type: "DIGITAL",
      priceCents: BigInt(9700),
      status: "ACTIVE",
      salesCount: 1420,
      externalPlatform: "KIWIFY",
    },
    {
      id: "prd_2",
      clientId: "cli_bruna_ppp",
      name: "Curso Online Craniopuntura de Yamamoto",
      type: "DIGITAL",
      priceCents: BigInt(14700),
      status: "ACTIVE",
      salesCount: 890,
      externalPlatform: "KIWIFY",
    },
    {
      id: "prd_3",
      clientId: "cli_bruna_ppp",
      name: "Curso Online Moxaterapia",
      type: "DIGITAL",
      priceCents: BigInt(8700),
      status: "ACTIVE",
      salesCount: 650,
      externalPlatform: "HOTMART",
    },
    {
      id: "prd_4",
      clientId: "cli_bruna_ppp",
      name: "Método Diagnóstico 360°",
      type: "DIGITAL",
      priceCents: BigInt(49700),
      status: "ACTIVE",
      salesCount: 430,
      externalPlatform: "KIWIFY",
    },
    {
      id: "prd_5",
      clientId: "cli_bruna_ppp",
      name: "Renovação Acupunturista Master",
      type: "SUBSCRIPTION",
      priceCents: BigInt(99700),
      status: "ACTIVE",
      salesCount: 210,
      isSubscription: true,
      renewalDays: 365,
      renewalLink: "https://pay.kiwify.com.br/renovacao-master",
      externalPlatform: "KIWIFY",
    },
    {
      id: "prd_6",
      clientId: "cli_bruna_ppp",
      name: "Programa Primeira Página (PPP)",
      type: "DIGITAL",
      priceCents: BigInt(99700),
      status: "ACTIVE",
      salesCount: 310,
      externalPlatform: "KIWIFY",
    },
  ];

  public recoveryItems: MockRecoveryItem[] = [
    {
      id: "rec_1",
      clientId: "cli_bruna_ppp",
      customerName: "Deuseli Q de Figueiredo Souza",
      customerPhone: "+5561998765432",
      customerEmail: "deuseli.souza@gmail.com",
      productName: "Curso Online 10 pontos, 50 soluções",
      amountCents: BigInt(9700),
      type: "ABANDONED_CART",
      status: "PENDING",
      platform: "KIWIFY",
      createdAt: "2026-09-25T10:15:00Z",
    },
    {
      id: "rec_2",
      clientId: "cli_bruna_ppp",
      customerName: "PAULO RENATO DAS NEVES PEREIRA",
      customerPhone: "+5511981234567",
      customerEmail: "paulo.renato@uol.com.br",
      productName: "Curso Online 10 pontos, 50 soluções",
      amountCents: BigInt(8700),
      type: "PENDING_PIX_BOLETO",
      status: "CONTACTED",
      platform: "KIWIFY",
      createdAt: "2026-09-25T09:40:00Z",
    },
    {
      id: "rec_3",
      clientId: "cli_bruna_ppp",
      customerName: "Fábio César Soares Hirata",
      customerPhone: "+5519992345678",
      customerEmail: "fabio.hirata@clinica.med.br",
      productName: "Curso Online Craniopuntura de Yamamoto",
      amountCents: BigInt(14700),
      type: "PAYMENT_REFUSED",
      status: "PENDING",
      platform: "HOTMART",
      createdAt: "2026-09-25T08:50:00Z",
    },
    {
      id: "rec_4",
      clientId: "cli_bruna_ppp",
      customerName: "Carla Pombo",
      customerPhone: "+5521976543210",
      customerEmail: "carla.pombo@yahoo.com.br",
      productName: "Método Diagnóstico 360°",
      amountCents: BigInt(49700),
      type: "ABANDONED_CART",
      status: "RECOVERED",
      platform: "KIWIFY",
      createdAt: "2026-09-24T18:30:00Z",
    },
    {
      id: "rec_5",
      clientId: "cli_bruna_ppp",
      customerName: "Maria das Graças Silva",
      customerPhone: "+5531988887777",
      customerEmail: "graca.silva@terra.com.br",
      productName: "Curso Online Moxaterapia",
      amountCents: BigInt(8700),
      type: "REFUND",
      status: "LOST",
      platform: "HOTMART",
      createdAt: "2026-09-23T14:20:00Z",
    },
  ];

  public chatConversations: MockChatConversation[] = [
    {
      id: "chat_1",
      clientId: "cli_bruna_ppp",
      leadId: null,
      phone: "+5521976543210",
      contactName: "Carla Pombo",
      contactPhone: "+55 21 97654-3210",
      chipKey: "aqc_bruna_01",
      temperature: "HOT",
      stage: "Fechamento",
      potentialCents: BigInt(49700),
      unreadCount: 1,
      lastMessage: "Quero sim, por favor!",
      lastMessageTime: "11:42",
      tags: ["VIP", "Quente", "Kiwify"],
      notes: "Interessada na mentoria com bônus de diagnóstico presencial.",
      messages: [
        {
          id: "msg_1",
          sender: "CONTACT",
          text: "Olá! Vi a oferta do Método Diagnóstico 360°, vocês parcelam no cartão?",
          time: "11:38",
          status: "READ",
        },
        {
          id: "msg_2",
          sender: "AGENT",
          text: "Olá Carla! Sim, parcelamos em até 12x sem juros pela Kiwify. Quer que eu te envie o link direto com o bônus garantido?",
          time: "11:40",
          status: "READ",
        },
        {
          id: "msg_3",
          sender: "CONTACT",
          text: "Quero sim, por favor!",
          time: "11:42",
          status: "DELIVERED",
        },
      ],
    },
    {
      id: "chat_2",
      clientId: "cli_bruna_ppp",
      leadId: "lead_1",
      phone: "+5511987654321",
      contactName: "Camila Ribeiro",
      contactPhone: "+55 11 98765-4321",
      chipKey: "aqc_bruna_01",
      temperature: "HOT",
      stage: "Pós-Venda",
      potentialCents: BigInt(99700),
      unreadCount: 0,
      lastMessage: "Parabéns Camila! Acabei de reenviar o link.",
      lastMessageTime: "10:15",
      tags: ["Aluno", "PPP"],
      notes: "Aluna confirmada do programa de acupuntura.",
      messages: [
        {
          id: "msg_4",
          sender: "CONTACT",
          text: "Acabei de fazer a inscrição no PPP! Onde pego o acesso às aulas?",
          time: "10:12",
          status: "READ",
        },
        {
          id: "msg_5",
          sender: "AGENT",
          text: "Parabéns Camila! Acabei de reenviar o link de acesso no seu e-mail e ativei seu bônus no portal.",
          time: "10:15",
          status: "READ",
        },
      ],
    },
    {
      id: "chat_3",
      clientId: "cli_bruna_ppp",
      leadId: "lead_2",
      phone: "+5521998877665",
      contactName: "Rodrigo Silveira",
      contactPhone: "+55 21 99887-7665",
      chipKey: "aqc_bruna_01",
      temperature: "HOT",
      stage: "Mentoria VIP",
      potentialCents: BigInt(149400),
      unreadCount: 0,
      lastMessage: "Confirmado para a aula de amanhã!",
      lastMessageTime: "09:20",
      tags: ["VIP", "Mentoria"],
      notes: "Comprou PPP com order bump de mentoria individual.",
      messages: [
        {
          id: "msg_6",
          sender: "CONTACT",
          text: "Nos vemos na mentoria ao vivo de sábado?",
          time: "09:18",
          status: "READ",
        },
        {
          id: "msg_7",
          sender: "AGENT",
          text: "Confirmado para a aula de amanhã! Link será enviado no grupo VIP.",
          time: "09:20",
          status: "READ",
        },
      ],
    },
  ];

  public launchGroups: MockLaunchGroupItem[] = Array.from({ length: 4 }, (_, i) => {
    const num = i + 1;
    const isFull = num <= 1;
    const memberCount = isFull ? 1000 : (num === 2 ? 650 : (num === 3 ? 320 : 14));
    return {
      id: `grp_${num}`,
      launchId: "lnc_1",
      name: `Lançamento Meteórico Bruna - Grupo ${num}`,
      number: num,
      memberCount,
      maxMembers: 1000,
      status: isFull ? "FULL" : "RECEIVING",
      inviteUrl: `https://chat.whatsapp.com/invite_bruna_outubro_${num}`,
      whatsappGroupId: `1203630${num}999@g.us`,
      position: num,
      createdAt: "2026-09-15T10:00:00.000Z",
    };
  });

  public launchParticipants: MockLaunchParticipant[] = [
    {
      id: "prt_1",
      launchId: "lnc_1",
      phone: "+5511999991001",
      name: "Mariana Alcantara",
      crmLeadId: "lead_1",
      groupIds: ["grp_1"],
      status: "ACTIVE",
      engagementScore: 75,
      classification: "HOT",
      joinedAt: "2026-09-16T14:20:00.000Z",
      leftAt: null,
    },
    {
      id: "prt_2",
      launchId: "lnc_1",
      phone: "+5511999991002",
      name: "Carlos Eduardo Silva",
      crmLeadId: null,
      groupIds: ["grp_2"],
      status: "ACTIVE",
      engagementScore: 45,
      classification: "WARM",
      joinedAt: "2026-09-18T11:05:00.000Z",
      leftAt: null,
    },
    {
      id: "prt_3",
      launchId: "lnc_1",
      phone: "+5511999991003",
      name: null,
      crmLeadId: null,
      groupIds: ["grp_2"],
      status: "LEFT",
      engagementScore: 0,
      classification: "COLD",
      joinedAt: "2026-09-19T09:30:00.000Z",
      leftAt: "2026-09-19T10:15:00.000Z",
    },
    {
      id: "prt_4",
      launchId: "lnc_1",
      phone: "+5511999991004",
      name: "Juliana Mendes",
      crmLeadId: "lead_2",
      groupIds: ["grp_3"],
      status: "BLOCKED",
      engagementScore: 0,
      classification: "COLD",
      joinedAt: "2026-09-20T16:00:00.000Z",
      leftAt: "2026-09-21T08:00:00.000Z",
    },
  ];

  public launchClicks: MockLaunchClick[] = [
    {
      id: "clk_1",
      launchId: "lnc_1",
      visitorId: "vis_101",
      utmSource: "instagram",
      utmMedium: "stories",
      utmCampaign: "captacao_outubro",
      assignedGroupId: "grp_1",
      createdAt: "2026-09-16T14:18:00.000Z",
    },
    {
      id: "clk_2",
      launchId: "lnc_1",
      visitorId: "vis_102",
      utmSource: "facebook",
      utmMedium: "feed",
      utmCampaign: "captacao_outubro",
      assignedGroupId: "grp_2",
      createdAt: "2026-09-18T11:02:00.000Z",
    },
    {
      id: "clk_3",
      launchId: "lnc_1",
      visitorId: "vis_103",
      utmSource: "google",
      utmMedium: "search",
      utmCampaign: "institucional",
      assignedGroupId: "grp_2",
      createdAt: "2026-09-19T09:28:00.000Z",
    },
  ];

  public launchCreationQueue: MockLaunchQueueItem[] = [];
  public launchMessages: MockLaunchMessage[] = [];
  public launchScheduledActions: MockLaunchScheduledGroupAction[] = [];
  public launchInboxMessages: MockLaunchInboxMessage[] = [
    {
      id: "inb_1",
      launchId: "lnc_1",
      participantPhone: "+5511999991001",
      participantName: "Mariana Alcantara",
      origin: "PRIVATE",
      messageText: "Olá Bruna! Qual o link para acessar a aula inaugural de amanhã?",
      status: "PENDING",
      suggestedReply: "Olá Mariana! O link da aula será enviado pontualmente às 19h aqui e no grupo VIP. Nos vemos lá!",
      confidencePercent: 92,
      isAutoReplied: false,
      receivedAt: "2026-10-07T16:30:00.000Z",
    },
    {
      id: "inb_2",
      launchId: "lnc_1",
      participantPhone: "+5511999991002",
      participantName: "Carlos Eduardo Silva",
      origin: "GROUP",
      groupId: "grp_2",
      messageText: "Tem certificado após o curso?",
      status: "PENDING",
      suggestedReply: "Sim, Carlos! Todos os participantes que assistirem a todas as aulas recebem certificado digital oficial.",
      confidencePercent: 88,
      isAutoReplied: false,
      receivedAt: "2026-10-07T17:15:00.000Z",
    },
  ];
  public launchWebhooks: MockLaunchWebhook[] = [];
  public launchWebhookDeliveries: MockLaunchWebhookDelivery[] = [];

  // Módulo de Conversões WhatsApp & Negócios Locais
  public conversionRules: ConversionRule[] = [
    ...createDefaultLocalBusinessRules("cli_sorriso_local"),
  ];
  public conversionAuditLogs: ConversionAuditLog[] = [];
  public conversionReviewQueue: ConversionReviewQueueItem[] = [];
  public websiteClickIntents: Map<string, any> = new Map();
  // Restrição única no banco/memória: leadId + ruleId + cycle
  public dispatchedRuleTracker: Set<string> = new Set();

  public hasRuleDispatched(leadId: string, ruleId: string, cycle: number = 1): boolean {
    return this.dispatchedRuleTracker.has(`${leadId}_${ruleId}_${cycle}`);
  }

  public registerDispatchedRule(leadId: string, ruleId: string, cycle: number = 1): boolean {
    const key = `${leadId}_${ruleId}_${cycle}`;
    if (this.dispatchedRuleTracker.has(key)) {
      return false; // Já disparou neste ciclo
    }
    this.dispatchedRuleTracker.add(key);
    return true;
  }

  public importCsvRows(rows: { name: string; email: string; phone?: string; product?: string; amount?: number; date?: string }[]) {
    let importedLeads = 0;
    let importedOrders = 0;

    for (const r of rows) {
      if (!r.email) continue;
      const cleanEmail = r.email.toLowerCase().trim();
      let lead = this.leads.find((l) => l.email === cleanEmail);

      const amountVal = r.amount ? Math.round(r.amount * 100) : 9700;
      let rfmAdd = 10;
      if (amountVal > 99700) rfmAdd = 200;
      else if (amountVal >= 49800) rfmAdd = 100;
      else if (amountVal >= 29800) rfmAdd = 50;
      else if (amountVal >= 9800) rfmAdd = 25;

      if (!lead) {
        lead = {
          id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          clientId: "cli_bruna_ppp",
          name: r.name || "Cliente Importado",
          email: cleanEmail,
          phone: r.phone ? (r.phone.startsWith("+") ? r.phone : `+55${r.phone.replace(/\D/g, "")}`) : "+5511999999999",
          temperature: "HOT",
          stage: "BUYER",
          rfmPoints: rfmAdd,
          totalSpentCents: BigInt(amountVal),
          purchaseCount: 1,
          lastSeen: r.date || new Date().toISOString(),
          attributionSource: "Importação CSV",
        };
        this.leads.unshift(lead);
        importedLeads++;
      } else {
        lead.rfmPoints += rfmAdd;
        lead.totalSpentCents += BigInt(amountVal);
        lead.purchaseCount += 1;
        lead.temperature = "HOT";
      }

      this.orders.unshift({
        id: `ord_csv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientId: "cli_bruna_ppp",
        leadName: lead.name,
        leadEmail: lead.email,
        productName: r.product || "Curso Online 10 pontos, 50 soluções",
        grossAmountCents: BigInt(amountVal),
        status: "CONFIRMED",
        platform: "KIWIFY",
        isAttributedToAds: false,
        adCampaignName: "Histórico Importado",
        createdAt: r.date || new Date().toISOString(),
        capiStatus: "SENT",
      });
      importedOrders++;
    }

    return { importedLeads, importedOrders, totalLeads: this.leads.length };
  }
}

export const mockDb = new MockDataStore();
