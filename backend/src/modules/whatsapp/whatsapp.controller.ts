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
