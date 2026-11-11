export type CrmSubTab =
  | 'leads'
  | 'products'
  | 'sales'
  | 'recovery'
  | 'automations'
  | 'conversionRules'
  | 'chat'
  | 'broadcasts'
  | 'import'
  | 'subscriptions'
  | 'notifications'
  | 'settings';

export type WhatsAppSubTab =
  | 'groups'
  | 'chat'
  | 'heater'
  | 'warming'
  | 'radar';

export interface ChatTarget {
  leadId?: string;
  conversationId?: string;
  name?: string;
  phone?: string;
  prefillText?: string;
  returnTo?: {
    crmSubTab: CrmSubTab;
    leadId?: string;
  };
}

export interface LeadAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string; // UF com 2 letras maiúsculas
  zipCode?: string;
}

export interface Lead {
  id: string;
  clientId: string;
  name: string;
  email: string;
  secondaryEmails?: string[];
  phone: string; // E.164, ex: +5511999999999
  cpf?: string;
  birthDate?: string; // YYYY-MM-DD
  address?: LeadAddress;
  temperature: 'HOT' | 'WARM' | 'COLD' | 'INACTIVE';
  stage: 'LEAD' | 'BUYER' | 'RECURRING' | 'VIP';
  rfmScore?: {
    r: number;
    f: number;
    m: number;
    total: number;
  };
  rfmPoints: number;
  totalSpentCents: number | bigint;
  purchaseCount: number;
  lastSeen: string;
  firstSeen?: string;
  attributionSource?: string;
  tags: string[];
  origin: 'ORGANIC' | 'ADS' | 'INDICATION' | 'IMPORT' | 'MANUAL';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  whatsappOptOut?: boolean;
  whatsappOptOutAt?: string;
  customFields?: Record<string, string | number | boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleOrder {
  id: string;
  clientId: string;
  leadId?: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  productName: string;
  grossAmountCents: number | bigint;
  status: 'CONFIRMED' | 'PENDING' | 'REFUNDED' | 'CHARGEBACK';
  platform: 'KIWIFY' | 'HOTMART' | 'EDUZZ' | 'GENERIC';
  isAttributedToAds: boolean;
  adCampaignName?: string;
  createdAt: string;
  paymentMethod?: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
}

export interface AutomationRule {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  triggerType: 'ABANDONED_CART' | 'PENDING_PIX_BOLETO' | 'PAYMENT_REFUSED' | 'NEW_LEAD' | 'BIRTHDAY';
  isActive: boolean;
  delayMinutes: number;
  templateMessage: string;
  sentCount: number;
  convertedCount: number;
  createdAt?: string;
}

export interface SubscriptionItem {
  id: string;
  clientId: string;
  leadId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  planName: string;
  amountCents: number | bigint;
  status: 'ACTIVE' | 'RENEWAL_DUE' | 'EXPIRED' | 'CANCELED';
  currentPeriodEnd: string;
  autoRenew: boolean;
}

export interface OperationalNotification {
  id: string;
  clientId: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  leadId?: string;
}
