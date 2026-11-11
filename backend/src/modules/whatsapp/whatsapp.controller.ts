import { Request, Response } from "express";
import { mockDb, MockWhatsAppInstance } from "../../services/mockDb.js";
import { evolutionClient } from "./evolutionClient.js";
import { sendGateService } from "../../services/sendGateService.js";
import { warmingNetworkService } from "../../services/warmingNetworkService.js";
import { leadRadarService } from "../../services/leadRadarService.js";
import { eventBus } from "../../services/eventBus.js";
import { ensureSystemTask, resolveSystemTask } from "../tasks/systemTasks.service.js";

export async function listInstances(req: Request, res: Response): Promise<void> {
  const disconnectedCount = mockDb.whatsappInstances.filter((i) => i.status === "DISCONNECTED").length;

  res.json({
    instances: mockDb.whatsappInstances,
    hasDisconnected: disconnectedCount > 0,
    disconnectedCount,
    safetyLockActive: disconnectedCount > 0,
  });
}

export async function createInstance(req: Request, res: Response): Promise<void> {
  const { name, phone, instanceKey } = req.body;

  const key = instanceKey || `aqc_inst_${Date.now().toString().slice(-4)}`;
  const newInst: MockWhatsAppInstance = {
    id: `inst_${Date.now()}`,
    name: name || `Chip Atendimento ${key}`,
    instanceKey: key,
    phone: phone || "+5511999990000",
    status: "QR_READY",
    warmingScore: 10,
    banRiskScore: 15,
    dailySendCap: 30,
    sentTodayCount: 0,
    lastActive: "Agora mesmo",
    proxy: "Proxy Residencial SP-01",
  };

  mockDb.whatsappInstances.push(newInst);

  eventBus.broadcast({
    type: "INSTANCE_STATUS_CHANGED",
    payload: { action: "CREATED", instance: newInst },
  });

  res.status(201).json({ success: true, instance: newInst });
}

export async function toggleInstanceStatus(req: Request, res: Response): Promise<void> {
  const instanceKey = String(req.params.instanceKey);
  const { status } = req.body;

  const inst = mockDb.whatsappInstances.find((i) => i.instanceKey === instanceKey);
  if (!inst) {
    res.status(404).json({ error: "Instância não encontrada" });
    return;
  }

  if (status) {
    inst.status = status;
  } else {
    inst.status = inst.status === "CONNECTED" ? "DISCONNECTED" : "CONNECTED";
  }

  // Prevenção automática e tarefas de sistema (spec 10.1 & A5.1)
  if (inst.status === "DISCONNECTED") {
    warmingNetworkService.handleChipDisconnect(instanceKey);
    ensureSystemTask({
      clientId: inst.clientId || "cli_bruna_ppp",
      sourceRef: `instance-down:${instanceKey}`,
      title: `Reconectar chip ${inst.name || instanceKey}`,
      area: "WHATSAPP",
      priority: "URGENT",
      link: "/whatsapp/chips",
    });
  } else if (inst.status === "CONNECTED") {
    resolveSystemTask(`instance-down:${instanceKey}`);
  }

  eventBus.broadcast({
    type: "INSTANCE_STATUS_CHANGED",
    payload: { action: "STATUS_UPDATED", instanceKey, status: inst.status },
  });

  res.json({ success: true, instance: inst });
}

export async function connectInstance(req: Request, res: Response): Promise<void> {
  const instanceKey = String(req.params.instanceKey || "aqc_demo_01");

  // Try Evolution API if configured, otherwise provide dynamic QR
  const realQr = await evolutionClient.connectInstance(instanceKey);

  if (realQr && realQr.base64) {
    res.json({
      status: "QR_READY",
      qrCodeBase64: realQr.base64,
    });
    return;
  }

  // Fallback mock QR code com payload dinâmico
  const qrSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="%23ffffff"/><rect x="20" y="20" width="60" height="60" fill="%230f172a"/><rect x="30" y="30" width="40" height="40" fill="%23ffffff"/><rect x="40" y="40" width="20" height="20" fill="%230f172a"/><rect x="140" y="20" width="60" height="60" fill="%230f172a"/><rect x="150" y="30" width="40" height="40" fill="%23ffffff"/><rect x="160" y="40" width="20" height="20" fill="%230f172a"/><rect x="20" y="140" width="60" height="60" fill="%230f172a"/><rect x="30" y="150" width="40" height="40" fill="%23ffffff"/><rect x="40" y="160" width="20" height="20" fill="%230f172a"/><circle cx="110" cy="110" r="18" fill="%2322c55e"/><text x="110" y="115" font-size="12" text-anchor="middle" fill="white" font-weight="bold">WA</text></svg>`;

  res.json({
    status: "QR_READY",
    instanceKey,
    qrCodeBase64: qrSvg,
    instructions: "Escaneie o código com seu WhatsApp para conectar a esteira anti-ban.",
  });
}

export async function listChats(req: Request, res: Response): Promise<void> {
  const { clientId } = req.query;
  const disconnected = mockDb.whatsappInstances.find((i) => i.status === "DISCONNECTED");

  let conversations = mockDb.chatConversations;
  if (clientId) {
    conversations = conversations.filter((c) => c.clientId === clientId);
  }

  const enriched = conversations.map((c) => ({
    ...c,
    phone: c.phone || (c.contactPhone ? '+' + c.contactPhone.replace(/\D/g, '') : ''),
    leadId: c.leadId || null,
  }));

  res.json({
    conversations: enriched,
    disconnectedAlert: disconnected
      ? {
          hasDisconnected: true,
          phone: disconnected.phone,
          message: `1 chip desconectado — resolver (${disconnected.phone})`,
        }
      : { hasDisconnected: false },
  });
}

export async function openChat(req: Request, res: Response): Promise<void> {
  const { leadId, phone, contactName, instanceKey, clientId = "cli_bruna_ppp" } = req.body;

  if (!phone || typeof phone !== "string") {
    res.status(400).json({ error: "Telefone é obrigatório para abrir uma conversa" });
    return;
  }

  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) {
    res.status(400).json({ error: "Telefone inválido" });
    return;
  }

  const normalizedPhone = '+' + digitsOnly;

  // Busca conversa existente do mesmo cliente com o mesmo telefone normalizado
  const existing = mockDb.chatConversations.find((c) => {
    if (c.clientId !== clientId) return false;
    const cPhoneDigits = (c.phone || c.contactPhone || "").replace(/\D/g, "");
    return cPhoneDigits === digitsOnly;
  });

  if (existing) {
    if (leadId && !existing.leadId) {
      existing.leadId = leadId;
    }
    if (!existing.phone) {
      existing.phone = normalizedPhone;
    }
    res.json({ conversation: existing });
    return;
  }

  // Verifica se o cliente possui alguma instância conectada
  const activeInstance = mockDb.whatsappInstances.find(
    (i) => (instanceKey ? i.instanceKey === instanceKey : true) && i.status === "CONNECTED"
  );

  if (!activeInstance) {
    res.status(409).json({
      error: "NO_CONNECTED_INSTANCE",
      message: "Nenhuma instância do WhatsApp conectada para este cliente. Conecte um chip no menu WhatsApp antes de iniciar conversas.",
    });
    return;
  }

  const newConv = {
    id: `chat_${Date.now()}`,
    clientId,
    leadId: leadId || null,
    phone: normalizedPhone,
    contactName: contactName || "Contato",
    contactPhone: phone.startsWith("+") ? phone : normalizedPhone,
    chipKey: activeInstance.instanceKey,
    temperature: "WARM" as const,
    stage: "Atendimento",
    potentialCents: BigInt(0),
    unreadCount: 0,
    lastMessage: "Conversa iniciada",
    lastMessageTime: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    tags: ["Lead"],
    notes: "",
    messages: [],
  };

  mockDb.chatConversations.unshift(newConv);
  res.status(201).json({ conversation: newConv });
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  const { conversationId, text } = req.body;
  const conv = mockDb.chatConversations.find((c) => c.id === conversationId);
  if (!conv) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  // Passar pelo crivo do SendGate Anti-Ban
  const instanceKey = conv.chipKey || "aqc_bruna_01";
  const dispatchPlan = sendGateService.planDispatch({
    instanceKey,
    rawText: text,
    leadName: conv.contactName,
  });

  if (!dispatchPlan.canSendNow) {
    res.status(403).json({
      success: false,
      error: dispatchPlan.reason,
      scheduledFor: dispatchPlan.scheduledFor,
    });
    return;
  }

  const finalMsgText = dispatchPlan.messageText;

  const newMsg = {
    id: `msg_${Date.now()}`,
    sender: "AGENT" as const,
    text: finalMsgText,
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    status: "DELIVERED" as const,
  };

  conv.messages.push(newMsg);
  conv.lastMessage = finalMsgText;
  conv.lastMessageTime = newMsg.time;

  res.json({
    success: true,
    message: newMsg,
    sendGate: {
      delaySeconds: dispatchPlan.delaySeconds,
      isCoffeeBreak: dispatchPlan.isCoffeeBreak,
      diagnostic: dispatchPlan.reason,
    },
  });
}

/**
 * Preview do motor SendGate (Spintax + Jitter Gaussiano)
 */
export async function previewSendGate(req: Request, res: Response): Promise<void> {
  const { text, instanceKey = "aqc_bruna_01", leadName = "Lead Exemplo" } = req.body;

  const plan = sendGateService.planDispatch({
    instanceKey,
    rawText: text || "{Olá|Oi|Tudo bem}, {nome}! Segue seu {acesso|link exclusivo}.",
    leadName,
  });

  res.json({
    success: true,
    originalText: text,
    parsedMessage: plan.messageText,
    gaussianDelaySeconds: plan.delaySeconds,
    isCoffeeBreak: plan.isCoffeeBreak,
    canSendNow: plan.canSendNow,
    diagnostic: plan.reason,
  });
}

// ==================== WARMING NETWORK P2P ====================

export async function getWarmingNetwork(req: Request, res: Response): Promise<void> {
  const data = warmingNetworkService.getWarmingStatus();
  res.json(data);
}

export async function toggleWarmingPair(req: Request, res: Response): Promise<void> {
  const pairId = String(req.params.pairId);
  const { status } = req.body;

  try {
    const pair = warmingNetworkService.togglePairStatus(pairId, status);
    res.json({ success: true, pair });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

export async function triggerWarmingStep(req: Request, res: Response): Promise<void> {
  const pairId = String(req.params.pairId);
  try {
    const log = warmingNetworkService.triggerSimulatedWarmStep(pairId);
    res.json({ success: true, log });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ==================== LEADRADAR B2B SEARCH ====================

export async function searchLeadRadar(req: Request, res: Response): Promise<void> {
  const { niche, location, onlyWithWhatsApp } = req.query;

  const result = leadRadarService.search({
    niche: niche as string,
    location: location as string,
    onlyWithWhatsApp: onlyWithWhatsApp === "true",
  });

  res.json(result);
}

export async function importLeadRadar(req: Request, res: Response): Promise<void> {
  const { items, clientId } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Nenhum lead selecionado para importação" });
    return;
  }

  const result = leadRadarService.importToCrm(items, (clientId as string) || "cli_bruna_ppp");
  res.json({ success: true, ...result });
}
