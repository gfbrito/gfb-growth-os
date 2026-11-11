/**
 * Tipagens, Enums e Presets do Módulo de Conversões por WhatsApp do GFB Growth OS
 */

export type BusinessType = "INFOPRODUTOR" | "NEGOCIO_LOCAL";

/**
 * Eventos oficiais aceitos pelo formato Meta Business Messaging
 * https://developers.facebook.com/docs/marketing-api/conversions-api/business-messaging
 */
export const ALLOWED_MESSAGING_EVENTS = [
  "Purchase",
  "LeadSubmitted",
  "InitiateCheckout",
  "AddToCart",
  "ViewContent",
  "OrderCreated",
  "OrderShipped",
  "OrderDelivered",
  "OrderCanceled",
  "OrderReturned",
  "CartAbandoned",
  "QualifiedLead",
  "RatingProvided",
  "ReviewProvided",
] as const;

export type MetaMessagingEvent = (typeof ALLOWED_MESSAGING_EVENTS)[number];

export type DashboardMetric = "NONE" | "LEAD" | "QUALIFIED_LEAD" | "SALE_REVENUE";
export type TriggerSender = "LEAD" | "ATTENDANT" | "BOTH";

export interface ConversionRule {
  id: string;
  clientId: string;
  name: string;
  isActive: boolean;
  stage: string; // Etapa do funil vinculada
  metaEvent: MetaMessagingEvent | "NONE";
  keywords: string[];
  allowedSender: TriggerSender;
  defaultValueCents: bigint;
  extractValueFromMessage: boolean;
  dashboardMetric: DashboardMetric;
  closesCycle: boolean;
  requiresConfirmation: boolean;
  isPrimaryForStage?: boolean; // Se verdadeiro, é o evento principal disparado ao mover para a etapa
}

export type ConversionRail = "BUSINESS_MESSAGING" | "WEB_REUSED" | "UNTRACKED";
export type AuditLogStatus = "DELIVERED" | "ERROR" | "NOT_SENT";

export interface ConversionAuditLog {
  id: string;
  clientId: string;
  leadId: string;
  leadName?: string;
  ruleId?: string;
  ruleName?: string;
  timestamp: string;
  event: string;
  amountCents: bigint;
  rail: ConversionRail;
  status: AuditLogStatus;
  reason?: string;
  metaResponse?: any;
  eventId: string;
  simulated: boolean;
}

export interface ConversionReviewQueueItem {
  id: string;
  clientId: string;
  leadId: string;
  leadName: string;
  ruleId: string;
  ruleName: string;
  detectedText: string;
  proposedEvent: string;
  proposedValueCents: bigint;
  confidenceScore: number; // 0.0 a 1.0
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LeadTrackingOrigin {
  originType: "CLICK_TO_WHATSAPP" | "WEBSITE_CLICK" | "UNTRACKED";
  ctwaClid?: string;
  adId?: string;
  adTitle?: string;
  adBody?: string;
  fbc?: string;
  fbp?: string;
  fbclid?: string;
  campaignId?: string;
  adsetId?: string;
  ip?: string;
  userAgent?: string;
  utms?: Record<string, string>;
  trackingCode?: string; // Código curto de match no WhatsApp
}

/**
 * Funil padrão para Negócio Local
 */
export const LOCAL_BUSINESS_DEFAULT_STAGES = [
  "Novo Lead",
  "Em Atendimento",
  "Qualificado",
  "Proposta",
  "Venda",
  "Perdido",
] as const;

/**
 * Cria o conjunto inicial de regras para NEGOCIO_LOCAL
 * Máximo de 4 eventos que enviam para a Meta:
 * 1. Novo Lead -> LeadSubmitted
 * 2. Qualificado -> QualifiedLead
 * 3. Proposta -> InitiateCheckout
 * 4. Venda -> Purchase (exige confirmação e valor > 0)
 */
export function createDefaultLocalBusinessRules(clientId: string): ConversionRule[] {
  return [
    {
      id: `rule_nl_lead_${clientId}`,
      clientId,
      name: "Primeira Mensagem Recebida",
      isActive: true,
      stage: "Novo Lead",
      metaEvent: "LeadSubmitted",
      keywords: [], // Disparado no primeiro contato
      allowedSender: "LEAD",
      defaultValueCents: BigInt(0),
      extractValueFromMessage: false,
      dashboardMetric: "LEAD",
      closesCycle: false,
      requiresConfirmation: false,
      isPrimaryForStage: true,
    },
    {
      id: `rule_nl_qual_${clientId}`,
      clientId,
      name: "Lead Qualificado (Interesse Declarado)",
      isActive: true,
      stage: "Qualificado",
      metaEvent: "QualifiedLead",
      keywords: ["orçamento", "endereço", "horário", "agendar", "quero saber mais", "preço", "quanto custa"],
      allowedSender: "LEAD",
      defaultValueCents: BigInt(0),
      extractValueFromMessage: false,
      dashboardMetric: "QUALIFIED_LEAD",
      closesCycle: false,
      requiresConfirmation: false,
      isPrimaryForStage: true,
    },
    {
      id: `rule_nl_init_${clientId}`,
      clientId,
      name: "Início de Fechamento (Proposta / Pagamento)",
      isActive: true,
      stage: "Proposta",
      metaEvent: "InitiateCheckout",
      keywords: ["chave pix", "link de pagamento", "forma de pagamento", "dados bancários", "contrato", "proposta"],
      allowedSender: "BOTH",
      defaultValueCents: BigInt(0),
      extractValueFromMessage: false,
      dashboardMetric: "NONE",
      closesCycle: false,
      requiresConfirmation: false,
      isPrimaryForStage: true,
    },
    {
      id: `rule_nl_pur_${clientId}`,
      clientId,
      name: "Venda Concluída no WhatsApp",
      isActive: true,
      stage: "Venda",
      metaEvent: "Purchase",
      keywords: ["comprovante", "pago", "pix enviado", "transferência feita", "fechado"],
      allowedSender: "BOTH",
      defaultValueCents: BigInt(0),
      extractValueFromMessage: true,
      dashboardMetric: "SALE_REVENUE",
      closesCycle: true,
      requiresConfirmation: true, // Trava obrigatória: só sai com confirmação ou botão Marcar Venda
      isPrimaryForStage: true,
    },
  ];
}
