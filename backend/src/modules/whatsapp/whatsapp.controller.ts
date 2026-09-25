import { Request, Response } from "express";
import { mockDb } from "../../services/mockDb.js";
import { evolutionClient } from "./evolutionClient.js";

export async function listInstances(req: Request, res: Response): Promise<void> {
  res.json({ instances: mockDb.whatsappInstances });
}

export async function connectInstance(req: Request, res: Response): Promise<void> {
  const instanceKey = String(req.params.instanceKey || "aqc_demo_01");

  // Try Evolution API if configured, otherwise provide mock QR
  const realQr = await evolutionClient.connectInstance(instanceKey);

  if (realQr && realQr.base64) {
    res.json({
      status: "QR_READY",
      qrCodeBase64: realQr.base64,
    });
    return;
  }

  // Fallback mock QR code
  res.json({
    status: "QR_READY",
    instanceKey,
    qrCodeBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    instructions: "Escaneie o código com seu WhatsApp para conectar a esteira anti-ban.",
  });
}

export async function listChats(req: Request, res: Response): Promise<void> {
  res.json({
    conversations: mockDb.chatConversations,
    disconnectedAlert: {
      hasDisconnected: true,
      phone: "+556492180233",
      message: "1 chip desconectado — resolver (+556492180233)",
    },
  });
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  const { conversationId, text } = req.body;
  const conv = mockDb.chatConversations.find((c) => c.id === conversationId);
  if (!conv) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  const newMsg = {
    id: `msg_${Date.now()}`,
    sender: "AGENT" as const,
    text,
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    status: "DELIVERED" as const,
  };

  conv.messages.push(newMsg);
  conv.lastMessage = text;
  conv.lastMessageTime = newMsg.time;

  res.json({ success: true, message: newMsg });
}
