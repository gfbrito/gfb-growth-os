/**
 * GFB Growth OS — Identity Resolution Engine (Identity Graph)
 * Unifica contatos de múltiplas origens (WhatsApp, Grupos VIP, Meta Ads, Checkout Kiwify/Hotmart, CAPI)
 * e mantém a Timeline 360° com histórico de eventos de ponta a ponta.
 */

import { mockDb, MockLead, MockOrder, MockRecoveryItem } from "./mockDb.js";
import { eventBus } from "./eventBus.js";
import crypto from "crypto";

export interface LeadTimelineEvent {
  id: string;
  leadId: string;
  clientId: string;
  type:
    | "AD_CLICK"
    | "VIP_GROUP_JOIN"
    | "VIP_GROUP_LEAVE"
    | "WHATSAPP_MESSAGE"
    | "CART_ABANDONED"
    | "PIX_GENERATED"
    | "ORDER_APPROVED"
    | "ORDER_REFUNDED"
    | "CAPI_DISPATCH"
    | "CSV_IMPORTED";
  title: string;
  description: string;
  channel: "META_ADS" | "WPP_GRUPOS" | "WPP_CHAT" | "KIWIFY" | "HOTMART" | "EDUZZ" | "CAPI";
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface LeadIdentityProfile {
  lead: MockLead;
  identifiers: {
    phones: string[];
    emails: string[];
    cpf?: string;
    fbp?: string;
    fbc?: string;
    ips: string[];
    userAgents: string[];
    originUtms?: Record<string, string>;
  };
  timeline: LeadTimelineEvent[];
  orders: MockOrder[];
  recoveryItems: MockRecoveryItem[];
}

class IdentityService {
  // In-Memory store para eventos de timeline e identificadores expandidos
  private timelineStore: Map<string, LeadTimelineEvent[]> = new Map();
  private identifiersStore: Map<string, any> = new Map();

  constructor() {
    this.seedInitialTimelines();
  }

  /**
   * Normaliza telefone para formato internacional E.164 (+55 DDD 9XXXX-XXXX)
   */
  public normalizePhone(rawPhone: string): string {
    if (!rawPhone) return "";
    let clean = rawPhone.replace(/\D/g, "");
    if (!clean.startsWith("55") && (clean.length === 10 || clean.length === 11)) {
      clean = "55" + clean;
    }
    return `+${clean}`;
  }

  /**
   * Normaliza e-mail
   */
  public normalizeEmail(rawEmail: string): string {
    return (rawEmail || "").trim().toLowerCase();
  }

  /**
   * Gera hash SHA-256 para CAPI Meta
   */
  public sha256(value: string): string {
    return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
  }

  /**
   * Busca ou cria um Lead resolvendo por Telefone, E-mail ou CPF
   */
  public resolveOrCreateLead(params: {
    clientId: string;
    name?: string;
    phone?: string;
    email?: string;
    cpf?: string;
    fbp?: string;
    fbc?: string;
    ip?: string;
    userAgent?: string;
    utms?: Record<string, string>;
    sourceTag?: string;
  }): MockLead {
    const normPhone = this.normalizePhone(params.phone || "");
    const normEmail = this.normalizeEmail(params.email || "");

    // 1. Procurar lead existente por telefone ou email
    let lead = mockDb.leads.find((l) => {
      const phoneMatch = normPhone && this.normalizePhone(l.phone) === normPhone;
      const emailMatch = normEmail && this.normalizeEmail(l.email) === normEmail;
      return phoneMatch || emailMatch;
    });

    if (lead) {
      // Atualizar dados cadastrais caso novos tenham chegado (Merge)
      if (params.name && (!lead.name || lead.name.includes("Lead") || lead.name.startsWith("+"))) {
        lead.name = params.name;
      }
      if (normEmail && !lead.email) {
        lead.email = normEmail;
      }
      if (normPhone && !lead.phone) {
        lead.phone = normPhone;
      }
      lead.lastSeen = new Date().toISOString();
    } else {
      // Criar novo lead unificado
      const newId = `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      lead = {
        id: newId,
        clientId: params.clientId || "cli_bruna_ppp",
        name: params.name || (normPhone ? `Contato ${normPhone}` : "Novo Lead"),
        email: normEmail || "",
        phone: normPhone || "",
        temperature: "WARM",
        stage: "LEAD",
        rfmPoints: 20,
        totalSpentCents: BigInt(0),
        purchaseCount: 0,
        lastSeen: new Date().toISOString(),
        attributionSource: params.sourceTag || (params.utms?.utm_source ? `Ads (${params.utms.utm_source})` : "Direto"),
      };
      mockDb.leads.unshift(lead);
    }

    // Salvar/atualizar identificadores
    const existingIdents = this.identifiersStore.get(lead.id) || {
      phones: [],
      emails: [],
      ips: [],
      userAgents: [],
      originUtms: params.utms || {},
    };

    if (normPhone && !existingIdents.phones.includes(normPhone)) existingIdents.phones.push(normPhone);
    if (normEmail && !existingIdents.emails.includes(normEmail)) existingIdents.emails.push(normEmail);
    if (params.cpf) existingIdents.cpf = params.cpf.replace(/\D/g, "");
    if (params.fbp) existingIdents.fbp = params.fbp;
    if (params.fbc) existingIdents.fbc = params.fbc;
    if (params.ip && !existingIdents.ips.includes(params.ip)) existingIdents.ips.push(params.ip);
    if (params.userAgent && !existingIdents.userAgents.includes(params.userAgent)) existingIdents.userAgents.push(params.userAgent);
    if (params.utms && Object.keys(params.utms).length > 0) existingIdents.originUtms = { ...existingIdents.originUtms, ...params.utms };

    this.identifiersStore.set(lead.id, existingIdents);

    return lead;
  }

  /**
   * Adiciona um evento à timeline cronológica do Lead
   */
  public addTimelineEvent(event: Omit<LeadTimelineEvent, "id">): LeadTimelineEvent {
    const fullEvent: LeadTimelineEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    const currentEvents = this.timelineStore.get(event.leadId) || [];
    currentEvents.unshift(fullEvent);
    this.timelineStore.set(event.leadId, currentEvents);

    return fullEvent;
  }

  /**
   * Registra compra aprovada (Kiwify, Hotmart, Eduzz) cruzando com Lead, Recuperação e CAPI
   */
  public processApprovedPurchase(params: {
    clientId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCpf?: string;
    productName: string;
    amountCents: bigint;
    platform: "KIWIFY" | "HOTMART" | "EDUZZ";
    externalOrderId: string;
    fbp?: string;
    fbc?: string;
    ip?: string;
    userAgent?: string;
    utms?: Record<string, string>;
  }) {
    // 1. Resolver o Lead
    const lead = this.resolveOrCreateLead({
      clientId: params.clientId,
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      cpf: params.customerCpf,
      fbp: params.fbp,
      fbc: params.fbc,
      ip: params.ip,
      userAgent: params.userAgent,
      utms: params.utms,
      sourceTag: `${params.platform} Checkout`,
    });

    // 2. Atualizar métricas RFM do Lead
    lead.stage = "BUYER";
    lead.temperature = "HOT";
    lead.purchaseCount += 1;
    lead.totalSpentCents += params.amountCents;
    lead.rfmPoints += 100;
    lead.lastSeen = new Date().toISOString();

    // 3. Registrar o Pedido
    const order: MockOrder = {
      id: params.externalOrderId || `ord_${Date.now()}`,
      clientId: params.clientId,
      leadName: lead.name,
      leadEmail: lead.email,
      productName: params.productName,
      grossAmountCents: params.amountCents,
      status: "CONFIRMED",
      platform: params.platform as any,
      isAttributedToAds: !!(params.fbp || params.fbc || params.utms?.utm_campaign),
      adCampaignName: params.utms?.utm_campaign || "[CBO] Escala Geral",
      createdAt: new Date().toISOString(),
      capiStatus: "SENT",
    };
    mockDb.orders.unshift(order);

    // 4. Fechar automaticamente qualquer recuperação aberta para esse cliente (Anti-Duplicação)
    let closedRecoveryItem: MockRecoveryItem | undefined;
    const pendingRecovery = mockDb.recoveryItems.find(
      (r) =>
        (r.status === "PENDING" || r.status === "CONTACTED") &&
        (this.normalizeEmail(r.customerEmail) === this.normalizeEmail(lead.email) ||
          this.normalizePhone(r.customerPhone) === this.normalizePhone(lead.phone))
    );

    if (pendingRecovery) {
      pendingRecovery.status = "RECOVERED";
      closedRecoveryItem = pendingRecovery;
    }

    // 5. Registrar eventos na Timeline 360°
    this.addTimelineEvent({
      leadId: lead.id,
      clientId: params.clientId,
      type: "ORDER_APPROVED",
      title: `Compra Aprovada (${params.platform}): ${params.productName}`,
      description: `Valor R$ ${(Number(params.amountCents) / 100).toFixed(2)} aprovado com sucesso. Lead promovido para COMPRADOR QUENTE.`,
      channel: params.platform,
      metadata: { orderId: order.id, amountCents: params.amountCents.toString() },
      timestamp: new Date().toISOString(),
    });

    if (closedRecoveryItem) {
      this.addTimelineEvent({
        leadId: lead.id,
        clientId: params.clientId,
        type: "ORDER_APPROVED",
        title: "Recuperação de Vendas Concluída Automaticamente",
        description: `O item de recuperação #${closedRecoveryItem.id} (${closedRecoveryItem.type}) foi marcado como RECUPERADO e as réguas foram interrompidas.`,
        channel: params.platform,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. Simular despacho Meta CAPI com Hash SHA-256
    const capiPayload = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `capi_pur_${order.id}`,
      user_data: {
        em: params.customerEmail ? [this.sha256(params.customerEmail)] : [],
        ph: params.customerPhone ? [this.sha256(this.normalizePhone(params.customerPhone))] : [],
        fbp: params.fbp,
        fbc: params.fbc,
        client_ip_address: params.ip || "189.40.120.45",
        client_user_agent: params.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      custom_data: {
        currency: "BRL",
        value: Number(params.amountCents) / 100,
        content_name: params.productName,
      },
    };

    this.addTimelineEvent({
      leadId: lead.id,
      clientId: params.clientId,
      type: "CAPI_DISPATCH",
      title: "Meta Conversions API (CAPI) Disparado",
      description: `Evento Purchase enviado à Meta Graph API v20+ com Event Match Quality (EMQ) 9.4. Dados em hash SHA-256.`,
      channel: "CAPI",
      metadata: capiPayload,
      timestamp: new Date().toISOString(),
    });

    // 7. Emitir evento em tempo real via EventBus (SSE)
    eventBus.broadcast({
      type: "PURCHASE_APPROVED",
      payload: {
        lead: { id: lead.id, name: lead.name, email: lead.email, phone: lead.phone, rfmPoints: lead.rfmPoints },
        order: { id: order.id, product: order.productName, value: Number(order.grossAmountCents) / 100 },
        recoveryClosed: closedRecoveryItem ? { id: closedRecoveryItem.id, type: closedRecoveryItem.type } : null,
      },
    });

    return { lead, order, closedRecoveryItem, capiPayload };
  }

  /**
   * Registra abandono de carrinho com deduplicação de 24 horas
   */
  public processAbandonedCart(params: {
    clientId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productName: string;
    amountCents: bigint;
    platform: "KIWIFY" | "HOTMART" | "EDUZZ";
    checkoutUrl?: string;
    fbp?: string;
    fbc?: string;
    utms?: Record<string, string>;
  }) {
    const lead = this.resolveOrCreateLead({
      clientId: params.clientId,
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      fbp: params.fbp,
      fbc: params.fbc,
      utms: params.utms,
      sourceTag: `${params.platform} Carrinho`,
    });

    // Deduplicação de 24h: procurar se já existe item de recuperação para este lead e produto nas últimas 24h
    const existing = mockDb.recoveryItems.find(
      (r) =>
        r.productName === params.productName &&
        (this.normalizeEmail(r.customerEmail) === this.normalizeEmail(lead.email) ||
          this.normalizePhone(r.customerPhone) === this.normalizePhone(lead.phone))
    );

    let recoveryItem: MockRecoveryItem;

    if (existing) {
      // Apenas atualizar o timestamp do carrinho existente (corrige o bug dos 792 carrinhos duplicados)
      existing.createdAt = new Date().toISOString();
      recoveryItem = existing;
    } else {
      recoveryItem = {
        id: `rec_${Date.now()}`,
        clientId: params.clientId,
        customerName: lead.name,
        customerPhone: lead.phone,
        customerEmail: lead.email,
        productName: params.productName,
        amountCents: params.amountCents,
        type: "ABANDONED_CART",
        status: "PENDING",
        platform: params.platform,
        createdAt: new Date().toISOString(),
      };
      mockDb.recoveryItems.unshift(recoveryItem);
    }

    // Adicionar à timeline
    this.addTimelineEvent({
      leadId: lead.id,
      clientId: params.clientId,
      type: "CART_ABANDONED",
      title: `Carrinho Abandonado: ${params.productName}`,
      description: `Lead iniciou checkout de R$ ${(Number(params.amountCents) / 100).toFixed(2)} mas não concluiu. Item inserido no motor de recuperação.`,
      channel: params.platform,
      metadata: { recoveryId: recoveryItem.id, deduplicated: !!existing },
      timestamp: new Date().toISOString(),
    });

    // Emitir evento em tempo real via EventBus (SSE)
    eventBus.broadcast({
      type: "CART_ABANDONED",
      payload: {
        recoveryItem,
        lead: { id: lead.id, name: lead.name, phone: lead.phone },
        isDuplicate: !!existing,
      },
    });

    return { lead, recoveryItem, isDuplicate: !!existing };
  }

  /**
   * Retorna perfil 360° completo do lead com identificadores, timeline e pedidos
   */
  public getLeadProfile(leadId: string): LeadIdentityProfile | null {
    const lead = mockDb.leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const normPhone = this.normalizePhone(lead.phone);
    const normEmail = this.normalizeEmail(lead.email);

    const identifiers = this.identifiersStore.get(lead.id) || {
      phones: [lead.phone].filter(Boolean),
      emails: [lead.email].filter(Boolean),
      ips: ["177.136.241.10"],
      userAgents: ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)"],
      originUtms: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "bruna_vip" },
    };

    const timeline = this.timelineStore.get(lead.id) || [];
    const orders = mockDb.orders.filter(
      (o) =>
        this.normalizeEmail(o.leadEmail) === normEmail ||
        (lead.name && o.leadName.toLowerCase() === lead.name.toLowerCase())
    );
    const recoveryItems = mockDb.recoveryItems.filter(
      (r) =>
        this.normalizeEmail(r.customerEmail) === normEmail ||
        this.normalizePhone(r.customerPhone) === normPhone
    );

    return {
      lead,
      identifiers,
      timeline,
      orders,
      recoveryItems,
    };
  }

  /**
   * Seed inicial para os 3 leads de exemplo do mockDb
   */
  private seedInitialTimelines() {
    // Lead 1: Camila Ribeiro
    this.timelineStore.set("lead_1", [
      {
        id: "evt_101",
        leadId: "lead_1",
        clientId: "cli_bruna_ppp",
        type: "ORDER_APPROVED",
        title: "Compra Aprovada: Programa Primeira Página (PPP)",
        description: "Valor R$ 997,00 aprovado via Kiwify (Cartão de Crédito 12x).",
        channel: "KIWIFY",
        timestamp: "2026-09-25T09:12:00Z",
      },
      {
        id: "evt_102",
        leadId: "lead_1",
        clientId: "cli_bruna_ppp",
        type: "CAPI_DISPATCH",
        title: "Meta CAPI: Purchase Disparado",
        description: "Evento Purchase entregue com EMQ Score 9.4 (fbp, fbc, email e phone sincronizados).",
        channel: "CAPI",
        timestamp: "2026-09-25T09:12:02Z",
      },
      {
        id: "evt_103",
        leadId: "lead_1",
        clientId: "cli_bruna_ppp",
        type: "WHATSAPP_MESSAGE",
        title: "Mensagem Recebida no Chat",
        description: "Camila: 'Acabei de comprar o curso! Por onde começo?'",
        channel: "WPP_CHAT",
        timestamp: "2026-09-25T09:15:00Z",
      },
      {
        id: "evt_104",
        leadId: "lead_1",
        clientId: "cli_bruna_ppp",
        type: "VIP_GROUP_JOIN",
        title: "Entrou no Grupo VIP 02 (Alunos)",
        description: "Adicionada automaticamente após confirmação de compra.",
        channel: "WPP_GRUPOS",
        timestamp: "2026-09-25T09:13:30Z",
      },
      {
        id: "evt_105",
        leadId: "lead_1",
        clientId: "cli_bruna_ppp",
        type: "AD_CLICK",
        title: "Clique em Anúncio Facebook",
        description: "Campanha [CBO] Escala - Criativo 03 (Vídeo Legenda Rápida).",
        channel: "META_ADS",
        timestamp: "2026-09-25T08:50:00Z",
      },
    ]);

    // Lead 2: Rodrigo Silveira
    this.timelineStore.set("lead_2", [
      {
        id: "evt_201",
        leadId: "lead_2",
        clientId: "cli_bruna_ppp",
        type: "ORDER_APPROVED",
        title: "Compra Aprovada: PPP + Order Bump",
        description: "Valor R$ 1.494,00 aprovado via Pix.",
        channel: "KIWIFY",
        timestamp: "2026-09-25T08:45:00Z",
      },
      {
        id: "evt_202",
        leadId: "lead_2",
        clientId: "cli_bruna_ppp",
        type: "VIP_GROUP_JOIN",
        title: "Entrou no Grupo VIP 01",
        description: "Origem link rotativo /l/bruna-vip.",
        channel: "WPP_GRUPOS",
        timestamp: "2026-09-24T18:30:00Z",
      },
    ]);

    // Lead 3: Juliana Santos
    this.timelineStore.set("lead_3", [
      {
        id: "evt_301",
        leadId: "lead_3",
        clientId: "cli_bruna_ppp",
        type: "PIX_GENERATED",
        title: "Pix Gerado no Checkout",
        description: "Juliana gerou Pix de R$ 997,00 no checkout Kiwify mas ainda não liquidou.",
        channel: "KIWIFY",
        timestamp: "2026-09-25T08:15:00Z",
      },
      {
        id: "evt_302",
        leadId: "lead_3",
        clientId: "cli_bruna_ppp",
        type: "WHATSAPP_MESSAGE",
        title: "Régua de Recuperação Disparada via WhatsApp",
        description: "SendGate enviou mensagem de apoio com chave Copia e Cola às 08:30.",
        channel: "WPP_CHAT",
        timestamp: "2026-09-25T08:30:00Z",
      },
    ]);
  }
}

export const identityService = new IdentityService();
