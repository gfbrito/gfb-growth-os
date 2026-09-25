/**
 * GFB Growth OS — Real-Time Event Bus & Server-Sent Events (SSE)
 * Emite eventos entre módulos (Webhooks → CRM → WhatsApp → CAPI → Dashboards)
 * permitindo atualização reativa em tempo real no frontend (< 50ms).
 */

import { Response } from "express";

export interface SystemEvent {
  type: "PURCHASE_APPROVED" | "CART_ABANDONED" | "GROUP_JOIN" | "CAPI_DISPATCHED" | "TASK_UPDATED";
  payload: any;
  timestamp: string;
}

class EventBusService {
  private clients: Set<Response> = new Set();

  /**
   * Conecta um cliente SSE do frontend
   */
  public registerClient(res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    this.clients.add(res);

    // Enviar evento de boas-vindas
    res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "Conectado ao Event Bus Real-Time" })}\n\n`);

    res.on("close", () => {
      this.clients.delete(res);
    });
  }

  /**
   * Emite um evento para todos os clientes conectados
   */
  public broadcast(event: Omit<SystemEvent, "timestamp">): void {
    const fullEvent: SystemEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    const message = `data: ${JSON.stringify(fullEvent)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

export const eventBus = new EventBusService();
