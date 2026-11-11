/**
 * GFB Growth OS — Controller de Conversões de WhatsApp & Negócios Locais
 * Gerencia regras, fila de revisão humana, log de auditoria, captura de cliques e webhook de chat.
 */

import { Request, Response } from "express";
import { mockDb, MockLead } from "../../services/mockDb.js";
import { ruleEngineService } from "./ruleEngine.service.js";
import { leadOriginCaptureService, websiteClickTrackerService } from "./whatsappAdapter.service.js";
import { conversionRouterService } from "./conversionRouter.service.js";
import { ConversionRule, createDefaultLocalBusinessRules } from "./conversion.types.js";

// ==========================================
// 1. REGRAS DE CONVERSÃO (CRUD)
// ==========================================

export async function listConversionRules(req: Request, res: Response): Promise<void> {
  const clientId = (req.query.clientId as string) || req.user?.clientId || "cli_sorriso_local";
  const client = mockDb.clients.find((c) => c.id === clientId);

  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  const rules = mockDb.conversionRules.filter((r) => r.clientId === clientId);
  res.json({
    rules,
    client: {
      id: client.id,
      name: client.name,
      businessType: client.businessType,
      conversionTrackingEnabled: client.conversionTrackingEnabled,
      simulationMode: client.simulationMode,
      wabaAccountId: client.wabaAccountId,
      wabaDatasetId: client.wabaDatasetId,
      stages: client.stages || ["Novo Lead", "Em Atendimento", "Qualificado", "Proposta", "Venda", "Perdido"],
    },
  });
}

export async function createConversionRule(req: Request, res: Response): Promise<void> {
  const userGrowthRole = (req.user as any)?.growthRole || "MASTER_AGENCY";

  // CLIENT_ATTENDANT não edita regras
  if (userGrowthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Atendentes não possuem permissão para criar regras de conversão." });
    return;
  }

  const {
    clientId = "cli_sorriso_local",
    name,
    stage,
    metaEvent,
    keywords = [],
    allowedSender = "BOTH",
    defaultValueCents = 0,
    extractValueFromMessage = false,
    dashboardMetric = "NONE",
    closesCycle = false,
    requiresConfirmation = false,
    isPrimaryForStage = false,
  } = req.body;

  if (!name || !stage || !metaEvent) {
    res.status(400).json({ error: "Campos obrigatórios: name, stage, metaEvent" });
    return;
  }

  const validation = ruleEngineService.validateRule(clientId, { metaEvent });
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const newRule: ConversionRule = {
    id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clientId,
    name,
    isActive: true,
    stage,
    metaEvent,
    keywords: Array.isArray(keywords) ? keywords : [],
    allowedSender,
    defaultValueCents: BigInt(defaultValueCents),
    extractValueFromMessage: Boolean(extractValueFromMessage),
    dashboardMetric,
    closesCycle: Boolean(closesCycle),
    requiresConfirmation: Boolean(requiresConfirmation),
    isPrimaryForStage: Boolean(isPrimaryForStage),
  };

  mockDb.conversionRules.push(newRule);
  res.status(201).json({ success: true, rule: newRule });
}

export async function updateConversionRule(req: Request, res: Response): Promise<void> {
  const userGrowthRole = (req.user as any)?.growthRole || "MASTER_AGENCY";
  if (userGrowthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Atendentes não possuem permissão para editar regras." });
    return;
  }

  const id = String(req.params.id);
  const rule = mockDb.conversionRules.find((r) => r.id === id);

  if (!rule) {
    res.status(404).json({ error: "Regra não encontrada" });
    return;
  }

  if (req.body.metaEvent) {
    const validation = ruleEngineService.validateRule(rule.clientId, { id: rule.id, metaEvent: req.body.metaEvent });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    rule.metaEvent = req.body.metaEvent;
  }

  if (req.body.name !== undefined) rule.name = req.body.name;
  if (req.body.isActive !== undefined) rule.isActive = req.body.isActive;
  if (req.body.stage !== undefined) rule.stage = req.body.stage;
  if (req.body.keywords !== undefined) rule.keywords = req.body.keywords;
  if (req.body.allowedSender !== undefined) rule.allowedSender = req.body.allowedSender;
  if (req.body.defaultValueCents !== undefined) rule.defaultValueCents = BigInt(req.body.defaultValueCents);
  if (req.body.extractValueFromMessage !== undefined) rule.extractValueFromMessage = req.body.extractValueFromMessage;
  if (req.body.dashboardMetric !== undefined) rule.dashboardMetric = req.body.dashboardMetric;
  if (req.body.closesCycle !== undefined) rule.closesCycle = req.body.closesCycle;
  if (req.body.requiresConfirmation !== undefined) rule.requiresConfirmation = req.body.requiresConfirmation;
  if (req.body.isPrimaryForStage !== undefined) rule.isPrimaryForStage = req.body.isPrimaryForStage;

  res.json({ success: true, rule });
}

export async function deleteConversionRule(req: Request, res: Response): Promise<void> {
  const userGrowthRole = (req.user as any)?.growthRole || "MASTER_AGENCY";
  if (userGrowthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Atendentes não possuem permissão para excluir regras." });
    return;
  }

  const id = String(req.params.id);
  const index = mockDb.conversionRules.findIndex((r) => r.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Regra não encontrada" });
    return;
  }

  mockDb.conversionRules.splice(index, 1);
  res.json({ success: true, message: "Regra excluída com sucesso" });
}

// ==========================================
// 2. FILA DE REVISÃO HUMANA
// ==========================================

export async function listReviewQueue(req: Request, res: Response): Promise<void> {
  const clientId = (req.query.clientId as string) || req.user?.clientId || "cli_sorriso_local";
  const items = mockDb.conversionReviewQueue.filter(
    (item) => item.clientId === clientId && item.status === "PENDING"
  );
  res.json({ items });
}

export async function approveReviewQueueItem(req: Request, res: Response): Promise<void> {
  const userGrowthRole = (req.user as any)?.growthRole || "MASTER_AGENCY";
  if (userGrowthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Atendentes não podem aprovar vendas na fila de revisão." });
    return;
  }

  const id = String(req.params.id);
  const item = mockDb.conversionReviewQueue.find((i) => i.id === id);

  if (!item || item.status !== "PENDING") {
    res.status(404).json({ error: "Item não encontrado ou já processado" });
    return;
  }

  const client = mockDb.clients.find((c) => c.id === item.clientId);
  const lead = mockDb.leads.find((l) => l.id === item.leadId);
  const rule = mockDb.conversionRules.find((r) => r.id === item.ruleId);

  if (!client || !lead || !rule) {
    res.status(400).json({ error: "Cliente, Lead ou Regra associada não encontrados" });
    return;
  }

  const confirmedValueCents = req.body.valueCents ? BigInt(req.body.valueCents) : item.proposedValueCents;

  // Dispara evento confirmado
  const cycle = lead.currentCycle || 1;
  const dispatchResult = await conversionRouterService.routeAndDispatch({
    client,
    lead,
    rule,
    cycle,
    amountCents: confirmedValueCents,
  });

  mockDb.registerDispatchedRule(lead.id, rule.id, cycle);
  if (rule.closesCycle) {
    lead.currentCycle = cycle + 1;
  }

  item.status = "APPROVED";
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = req.user?.name || "Gestor";

  res.json({
    success: true,
    message: "Item aprovado e conversão despachada!",
    dispatchResult,
  });
}

export async function rejectReviewQueueItem(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const item = mockDb.conversionReviewQueue.find((i) => i.id === id);

  if (!item || item.status !== "PENDING") {
    res.status(404).json({ error: "Item não encontrado ou já processado" });
    return;
  }

  item.status = "REJECTED";
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = req.user?.name || "Operador";

  res.json({ success: true, message: "Item rejeitado com sucesso" });
}

// ==========================================
// 3. LOG DE AUDITORIA & CONFIGURAÇÕES
// ==========================================

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const clientId = (req.query.clientId as string) || req.user?.clientId || "cli_sorriso_local";
  const railFilter = req.query.rail as string;

  let logs = mockDb.conversionAuditLogs.filter((l) => l.clientId === clientId);
  if (railFilter) {
    logs = logs.filter((l) => l.rail === railFilter);
  }

  res.json({ logs });
}

export async function updateConversionSettings(req: Request, res: Response): Promise<void> {
  const userGrowthRole = (req.user as any)?.growthRole || "MASTER_AGENCY";
  const { clientId = "cli_sorriso_local", businessType, conversionTrackingEnabled, simulationMode, wabaAccountId, wabaDatasetId } = req.body;

  const client = mockDb.clients.find((c) => c.id === clientId);
  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  // Regra de permissão: Mudança de businessType e desligar modo simulação SÓ pela agência (MASTER_AGENCY)
  if (businessType && businessType !== client.businessType) {
    if (userGrowthRole !== "MASTER_AGENCY") {
      res.status(403).json({ error: "Apenas a agência (MASTER_AGENCY) pode alterar o tipo de negócio do cliente." });
      return;
    }
    client.businessType = businessType;

    // Se mudou para NEGOCIO_LOCAL, popula regras e funil padrão se ainda não existirem
    if (businessType === "NEGOCIO_LOCAL") {
      client.stages = ["Novo Lead", "Em Atendimento", "Qualificado", "Proposta", "Venda", "Perdido"];
      const existingRules = mockDb.conversionRules.filter((r) => r.clientId === client.id);
      if (existingRules.length === 0) {
        mockDb.conversionRules.push(...createDefaultLocalBusinessRules(client.id));
      }
    }
  }

  if (simulationMode !== undefined && simulationMode !== client.simulationMode) {
    if (userGrowthRole !== "MASTER_AGENCY") {
      res.status(403).json({ error: "Apenas a agência (MASTER_AGENCY) pode alternar o Modo Simulação." });
      return;
    }
    client.simulationMode = simulationMode;
  }

  if (conversionTrackingEnabled !== undefined) {
    client.conversionTrackingEnabled = conversionTrackingEnabled;
  }
  if (wabaAccountId !== undefined) client.wabaAccountId = wabaAccountId;
  if (wabaDatasetId !== undefined) client.wabaDatasetId = wabaDatasetId;

  res.json({
    success: true,
    client: {
      id: client.id,
      name: client.name,
      businessType: client.businessType,
      conversionTrackingEnabled: client.conversionTrackingEnabled,
      simulationMode: client.simulationMode,
      wabaAccountId: client.wabaAccountId,
      wabaDatasetId: client.wabaDatasetId,
    },
  });
}

// ==========================================
// 4. CAPTURA DE CLIQUES NO SITE (REDIRECT)
// ==========================================

export async function createWebsiteTrackingClick(req: Request, res: Response): Promise<void> {
  const {
    clientId = "cli_sorriso_local",
    phoneDestination = "5511999990000",
    baseMessage,
    fbp,
    fbc,
    fbclid,
    campaignId,
    adsetId,
    adId,
    utms,
  } = req.body;

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  const result = websiteClickTrackerService.registerClick({
    clientId,
    phoneDestination,
    baseMessage,
    fbp,
    fbc,
    fbclid,
    campaignId,
    adsetId,
    adId,
    ip,
    userAgent,
    utms,
  });

  res.json({ success: true, ...result });
}

// ==========================================
// 5. INBOUND WHATSAPP MESSAGE WEBHOOK
// ==========================================

export async function handleInboundWhatsAppMessage(req: Request, res: Response): Promise<void> {
  try {
    const {
      clientId = "cli_sorriso_local",
      phone,
      contactName,
      messageText,
      sender = "LEAD",
      rawWebhook,
    } = req.body;

    if (!phone) {
      res.status(400).json({ error: "Telefone é obrigatório" });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const e164Phone = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

    // 1. Localiza ou cria o lead
    let lead = mockDb.leads.find((l) => l.clientId === clientId && l.phone === e164Phone);
    if (!lead) {
      lead = {
        id: `lead_wa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientId,
        name: contactName || "Novo Lead WhatsApp",
        email: `${cleanPhone}@lead.whatsapp.com`,
        phone: e164Phone,
        temperature: "WARM",
        stage: "LEAD",
        rfmPoints: 10,
        totalSpentCents: BigInt(0),
        purchaseCount: 0,
        lastSeen: new Date().toISOString(),
        currentCycle: 1,
      };
      mockDb.leads.unshift(lead);
    }

    // 2. Captura e congela a origem na primeira mensagem (CTWA vs Clique no Site vs Sem Identificador)
    const origin = leadOriginCaptureService.captureAndLockOrigin(lead, {
      messageText,
      rawWebhook,
    });

    // 3. Avalia o motor de regras
    const evaluationResults = await ruleEngineService.evaluateMessage({
      clientId,
      lead,
      messageText: messageText || "",
      sender: sender as any,
    });

    res.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        originType: lead.originType,
        ctwaClid: lead.ctwaClid,
        fbc: lead.fbc,
        fbp: lead.fbp,
        currentCycle: lead.currentCycle,
      },
      origin,
      evaluationResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ==========================================
// 6. BOTÃO "MARCAR VENDA" NO ATENDIMENTO
// ==========================================

export async function markManualSale(req: Request, res: Response): Promise<void> {
  const { clientId = "cli_sorriso_local", leadId, amountCents } = req.body;

  if (!leadId || !amountCents || BigInt(amountCents) <= BigInt(0)) {
    res.status(400).json({ error: "leadId e amountCents maior que zero são obrigatórios" });
    return;
  }

  const client = mockDb.clients.find((c) => c.id === clientId);
  const lead = mockDb.leads.find((l) => l.id === leadId);

  if (!client || !lead) {
    res.status(404).json({ error: "Cliente ou Lead não encontrado" });
    return;
  }

  const purchaseRule = mockDb.conversionRules.find(
    (r) => r.clientId === clientId && r.metaEvent === "Purchase" && r.isActive
  );

  if (!purchaseRule) {
    res.status(400).json({ error: "Nenhuma regra mapeada para Purchase ativa neste cliente." });
    return;
  }

  const cycle = lead.currentCycle || 1;
  const valBigInt = BigInt(amountCents);

  // Marcar venda manual confirma a venda imediatamente
  const dispatchResult = await conversionRouterService.routeAndDispatch({
    client,
    lead,
    rule: purchaseRule,
    cycle,
    amountCents: valBigInt,
  });

  mockDb.registerDispatchedRule(lead.id, purchaseRule.id, cycle);
  lead.stage = "BUYER";
  lead.purchaseCount += 1;
  lead.totalSpentCents += valBigInt;

  if (purchaseRule.closesCycle) {
    lead.currentCycle = cycle + 1;
  }

  res.json({
    success: true,
    message: "Venda marcada com sucesso!",
    dispatchResult,
    lead: {
      id: lead.id,
      stage: lead.stage,
      totalSpentCents: lead.totalSpentCents,
      currentCycle: lead.currentCycle,
    },
  });
}
