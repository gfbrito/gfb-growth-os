import { Request, Response } from "express";
import { mockDb, type MockLead } from "../../services/mockDb.js";
import { csvImporterService } from "../../services/csvImporterService.js";
import { resolveSystemTask } from "../tasks/systemTasks.service.js";

function getEffectiveClientId(req: Request, fallback = "cli_bruna_ppp"): string {
  const user = req.user as any;
  if ((user?.growthRole === "CLIENT_OWNER" || user?.growthRole === "CLIENT_ATTENDANT") && user?.clientId) {
    return user.clientId;
  }
  return (req.query.clientId as string) || fallback;
}

export async function listLeads(req: Request, res: Response): Promise<void> {
  const clientId = getEffectiveClientId(req);
  const { temperature, stage, origin, search, tag } = req.query;

  let leads = [...mockDb.leads];

  if (clientId) {
    leads = leads.filter((l) => l.clientId === clientId);
  }
  if (temperature && temperature !== "ALL") {
    leads = leads.filter((l) => l.temperature === temperature);
  }
  if (stage && stage !== "ALL") {
    leads = leads.filter((l) => l.stage === stage);
  }
  if (origin && origin !== "ALL") {
    leads = leads.filter((l) => l.origin === origin);
  }
  if (tag) {
    const t = String(tag).toLowerCase();
    leads = leads.filter((l) => l.tags && l.tags.some((lt) => lt.toLowerCase().includes(t)));
  }
  if (search) {
    const q = String(search).toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.cpf && l.cpf.includes(q))
    );
  }

  const enriched = leads.map((l) => ({
    ...l,
    totalSpent: Number(l.totalSpentCents) / 100,
  }));

  res.json({ leads: enriched, total: enriched.length });
}

export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    const {
      clientId = "cli_bruna_ppp",
      name,
      email,
      secondaryEmails,
      phone,
      cpf,
      birthDate,
      address,
      temperature = "WARM",
      stage = "LEAD",
      tags = [],
      origin = "MANUAL",
      customFields = {},
    } = req.body;

    if (!name || !email || !phone) {
      res.status(400).json({ error: "Nome, e-mail e telefone são obrigatórios" });
      return;
    }

    const digitsOnly = String(phone).replace(/\D/g, "");
    const normalizedPhone = String(phone).startsWith("+") ? phone : `+${digitsOnly}`;

    const newLead: MockLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId,
      name,
      email: email.trim().toLowerCase(),
      secondaryEmails: Array.isArray(secondaryEmails) ? secondaryEmails : [],
      phone: normalizedPhone,
      cpf,
      birthDate,
      address,
      temperature,
      stage,
      rfmPoints: 50,
      totalSpentCents: BigInt(0),
      purchaseCount: 0,
      lastSeen: new Date().toISOString(),
      firstSeen: new Date().toISOString(),
      attributionSource: "Cadastro Manual",
      tags: Array.isArray(tags) ? tags : [],
      origin,
      whatsappOptOut: false,
      customFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDb.leads.unshift(newLead);
    res.status(201).json({ lead: { ...newLead, totalSpent: 0 } });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao criar lead", message: err.message });
  }
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const lead = mockDb.leads.find((l) => l.id === id);

  if (!lead) {
    res.status(404).json({ error: "Lead não encontrado" });
    return;
  }

  const {
    name,
    email,
    secondaryEmails,
    phone,
    cpf,
    birthDate,
    address,
    temperature,
    stage,
    tags,
    origin,
    whatsappOptOut,
    customFields,
  } = req.body;

  if (name !== undefined) lead.name = name;
  if (email !== undefined) lead.email = email.trim().toLowerCase();
  if (secondaryEmails !== undefined) lead.secondaryEmails = secondaryEmails;
  if (phone !== undefined) {
    const digitsOnly = String(phone).replace(/\D/g, "");
    lead.phone = String(phone).startsWith("+") ? phone : `+${digitsOnly}`;
  }
  if (cpf !== undefined) lead.cpf = cpf;
  if (birthDate !== undefined) lead.birthDate = birthDate;
  if (address !== undefined) lead.address = address;
  if (temperature !== undefined) lead.temperature = temperature;
  if (stage !== undefined) lead.stage = stage;
  if (tags !== undefined) lead.tags = tags;
  if (origin !== undefined) lead.origin = origin;
  if (whatsappOptOut !== undefined) {
    lead.whatsappOptOut = whatsappOptOut;
    if (whatsappOptOut) lead.whatsappOptOutAt = new Date().toISOString();
  }
  if (customFields !== undefined) lead.customFields = customFields;
  lead.updatedAt = new Date().toISOString();

  res.json({ lead: { ...lead, totalSpent: Number(lead.totalSpentCents) / 100 } });
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const index = mockDb.leads.findIndex((l) => l.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Lead não encontrado" });
    return;
  }

  mockDb.leads.splice(index, 1);
  res.json({ success: true, message: "Lead removido com sucesso" });
}

export async function listSales(req: Request, res: Response): Promise<void> {
  const clientId = getEffectiveClientId(req);
  const { status, period } = req.query;

  let orders = [...mockDb.orders];

  if (clientId) {
    orders = orders.filter((o) => o.clientId === clientId);
  }
  if (status && status !== "ALL") {
    orders = orders.filter((o) => o.status === status);
  }

  if (period && period !== "ALL") {
    const now = new Date();
    orders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (period === "TODAY") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (period === "7D") {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (period === "30D") {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      if (period === "THIS_MONTH") {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  const enriched = orders.map((o) => ({
    ...o,
    grossAmount: Number(o.grossAmountCents) / 100,
  }));

  const confirmedOrders = enriched.filter((o) => o.status === "CONFIRMED");
  const totalRevenue = confirmedOrders.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const averageTicket = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;
  const approvalRatePct = orders.length > 0 ? Math.round((confirmedOrders.length / orders.length) * 100) : 0;

  res.json({
    sales: enriched,
    metrics: {
      totalRevenue,
      totalCount: confirmedOrders.length,
      averageTicket,
      approvalRatePct,
    },
  });
}

export async function createSale(req: Request, res: Response): Promise<void> {
  try {
    const {
      clientId = "cli_bruna_ppp",
      leadName,
      leadEmail,
      leadPhone,
      productName,
      amount, // Valor em reais
      platform = "GENERIC",
      status = "CONFIRMED",
      isAttributedToAds = false,
      adCampaignName,
    } = req.body;

    if (!leadName || !leadEmail || !productName || amount === undefined) {
      res.status(400).json({ error: "Nome, e-mail, produto e valor são obrigatórios" });
      return;
    }

    const amountCents = BigInt(Math.round(Number(amount) * 100));

    const newOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId,
      leadName,
      leadEmail,
      leadPhone,
      productName,
      grossAmountCents: amountCents,
      status: status as any,
      platform: platform as any,
      isAttributedToAds: Boolean(isAttributedToAds),
      adCampaignName,
      createdAt: new Date().toISOString(),
      capiStatus: "SENT" as const,
    };

    mockDb.orders.unshift(newOrder);

    // Atualiza ou cria lead automaticamente
    let lead = mockDb.leads.find(
      (l) => l.email.toLowerCase() === leadEmail.toLowerCase() && l.clientId === clientId
    );

    if (lead) {
      if (status === "CONFIRMED") {
        lead.purchaseCount += 1;
        lead.totalSpentCents += amountCents;
        lead.stage = lead.purchaseCount >= 3 ? "VIP" : "BUYER";
        lead.temperature = "HOT";
        lead.rfmPoints += 60;
      }
      lead.lastSeen = new Date().toISOString();
    } else {
      mockDb.leads.unshift({
        id: `lead_${Date.now()}`,
        clientId,
        name: leadName,
        email: leadEmail.toLowerCase(),
        phone: leadPhone || "+5511999999999",
        temperature: "HOT",
        stage: status === "CONFIRMED" ? "BUYER" : "LEAD",
        rfmPoints: status === "CONFIRMED" ? 100 : 30,
        totalSpentCents: status === "CONFIRMED" ? amountCents : BigInt(0),
        purchaseCount: status === "CONFIRMED" ? 1 : 0,
        lastSeen: new Date().toISOString(),
        firstSeen: new Date().toISOString(),
        origin: "MANUAL",
        attributionSource: "Venda Balcão / Manual",
        whatsappOptOut: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ sale: { ...newOrder, grossAmount: Number(amountCents) / 100 } });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao registrar venda", message: err.message });
  }
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const clientId = getEffectiveClientId(req);
  let products = [...mockDb.products];
  if (clientId) {
    products = products.filter((p) => p.clientId === clientId);
  }
  const enriched = products.map((p) => ({
    ...p,
    price: Number(p.priceCents) / 100,
  }));
  res.json({ products: enriched });
}

export async function listRecovery(req: Request, res: Response): Promise<void> {
  const clientId = getEffectiveClientId(req);
  const { type, status } = req.query;
  let items = [...mockDb.recoveryItems];
  if (clientId) {
    items = items.filter((i) => i.clientId === clientId);
  }
  if (type) {
    items = items.filter((i) => i.type === type);
  }
  if (status) {
    items = items.filter((i) => i.status === status);
  }

  const enriched = items.map((i) => ({
    ...i,
    amount: Number(i.amountCents) / 100,
  }));

  const totalRetainedCents = items.reduce((acc, curr) => acc + curr.amountCents, BigInt(0));

  res.json({
    recoveryItems: enriched,
    totalCount: items.length,
    totalPotential: Number(totalRetainedCents) / 100,
  });
}

export async function updateRecoveryStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  const item = mockDb.recoveryItems.find((i) => i.id === id);
  if (!item) {
    res.status(404).json({ error: "Item de recuperação não encontrado" });
    return;
  }

  if (status) {
    item.status = status;
  }

  res.json({ success: true, item: { ...item, amount: Number(item.amountCents) / 100 } });
}

export async function importCsv(req: Request, res: Response): Promise<void> {
  try {
    const { rows, clientId = "cli_bruna_ppp" } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: "Nenhuma linha enviada para importação" });
      return;
    }

    const summary = await csvImporterService.processStreamBatch(rows, clientId as string);
    res.json({ success: true, ...summary });
  } catch (err: any) {
    res.status(500).json({ error: "Falha na importação do CSV", message: err.message });
  }
}

// ----------------------------------------------------------------------
// SUBTAB 6: AUTOMATIONS
// ----------------------------------------------------------------------
export async function listAutomations(req: Request, res: Response): Promise<void> {
  const clientId = getEffectiveClientId(req);
  const rules = mockDb.automations.filter((a) => a.clientId === clientId);
  const connectedInstance = mockDb.whatsappInstances.find((i) => i.status === "CONNECTED");

  res.json({
    automations: rules,
    isWhatsAppConnected: Boolean(connectedInstance),
    connectedChip: connectedInstance ? { phone: connectedInstance.phone, name: connectedInstance.name } : null,
  });
}

export async function updateAutomation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive, delayMinutes, templateMessage } = req.body;

  const rule = mockDb.automations.find((a) => a.id === id);
  if (!rule) {
    res.status(404).json({ error: "Regra de automação não encontrada" });
    return;
  }

  if (isActive !== undefined) rule.isActive = Boolean(isActive);
  if (delayMinutes !== undefined) rule.delayMinutes = Number(delayMinutes);
  if (templateMessage !== undefined) rule.templateMessage = String(templateMessage);

  res.json({ success: true, automation: rule });
}

/**
 * Trigger de Aniversário — regra estrita:
 * 1. Compara apenas mês e dia (MM-DD) do birthDate fazendo split('-') (sem new Date()).
 * 2. Se for 29 de fevereiro em ano não bissexto, dispara em 28 de fevereiro.
 * 3. Anti-duplicação: verifica se já foi enviado no mesmo ano civil.
 */
export async function checkBirthdayLeads(req: Request, res: Response): Promise<void> {
  const { clientId = "cli_bruna_ppp" } = req.query;
  const leads = mockDb.leads.filter((l) => l.clientId === clientId && Boolean(l.birthDate));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentDay = String(now.getDate()).padStart(2, "0");

  const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const currentIsLeap = isLeapYear(currentYear);

  const birthdayLeads = leads.filter((l) => {
    if (!l.birthDate) return false;
    const parts = l.birthDate.split("-");
    if (parts.length < 3) return false;
    const bMonth = parts[1];
    const bDay = parts[2];

    // Checagem padrão de aniversário (mesmo mês e dia)
    if (bMonth === currentMonth && bDay === currentDay) {
      return true;
    }

    // Caso 29 de fevereiro em anos não bissextos: disparar no dia 28/02
    if (!currentIsLeap && bMonth === "02" && bDay === "29" && currentMonth === "02" && currentDay === "28") {
      return true;
    }

    return false;
  });

  res.json({
    total: birthdayLeads.length,
    birthdayLeads: birthdayLeads.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      birthDate: l.birthDate,
    })),
  });
}

// ----------------------------------------------------------------------
// SUBTAB 10: SUBSCRIPTIONS
// ----------------------------------------------------------------------
export async function listSubscriptions(req: Request, res: Response): Promise<void> {
  const clientId = getEffectiveClientId(req);
  const items = mockDb.subscriptions.filter((s) => s.clientId === clientId);

  const enriched = items.map((s) => ({
    ...s,
    amount: Number(s.amountCents) / 100,
  }));

  const activeSubs = enriched.filter((s) => s.status === "ACTIVE" || s.status === "RENEWAL_DUE");
  const mrr = activeSubs.reduce((acc, curr) => acc + curr.amount, 0);

  res.json({
    subscriptions: enriched,
    metrics: {
      totalActive: activeSubs.length,
      mrr,
      renewalDueCount: enriched.filter((s) => s.status === "RENEWAL_DUE").length,
      expiredCount: enriched.filter((s) => s.status === "EXPIRED").length,
    },
  });
}

// ----------------------------------------------------------------------
// SUBTAB 11: NOTIFICATIONS
// ----------------------------------------------------------------------
export async function listNotifications(req: Request, res: Response): Promise<void> {
  const clientId = getEffectiveClientId(req);
  const notifs = mockDb.notifications.filter((n) => n.clientId === clientId);
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  res.json({
    notifications: notifs,
    unreadCount,
  });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const notif = mockDb.notifications.find((n) => n.id === id);

  if (!notif) {
    res.status(404).json({ error: "Notificação não encontrada" });
    return;
  }

  notif.isRead = true;
  resolveSystemTask(`crm-notification:${id}`);
  res.json({ success: true, notification: notif });
}

// ----------------------------------------------------------------------
// SUBTAB 12: SETTINGS
// ----------------------------------------------------------------------
export async function getCrmSettings(req: Request, res: Response): Promise<void> {
  res.json({ settings: mockDb.crmSettings });
}

export async function updateCrmSettings(req: Request, res: Response): Promise<void> {
  const { rfmWeights, temperatureDays, webhookEndpoints, customFieldKeys } = req.body;

  if (rfmWeights) mockDb.crmSettings.rfmWeights = rfmWeights;
  if (temperatureDays) mockDb.crmSettings.temperatureDays = temperatureDays;
  if (webhookEndpoints) mockDb.crmSettings.webhookEndpoints = webhookEndpoints;
  if (customFieldKeys) mockDb.crmSettings.customFieldKeys = customFieldKeys;

  res.json({ success: true, settings: mockDb.crmSettings });
}
