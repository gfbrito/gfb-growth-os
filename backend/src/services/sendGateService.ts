/**
 * GFB Growth OS — SendGate: Motor Anti-Ban & Pacing Matemático
 * Pacing Gaussiano (15s-45s), Pausas de "Coffee Break", Spintax nativo,
 * Janela Estrita de Atendimento (08h-21h) e Bloqueio Preventivo de Filas.
 */

import { mockDb } from "./mockDb.js";
import { logger } from "../utils/logger.js";

export interface SendGateDispatchPlan {
  messageText: string;
  delaySeconds: number;
  isCoffeeBreak: boolean;
  canSendNow: boolean;
  scheduledFor?: string;
  reason?: string;
}

class SendGateService {
  // Rastreamento de envios por chip para coffee break
  private instanceCounters: Map<string, { sentCount: number; lastSentAt: number }> = new Map();

  /**
   * Verifica se o horário atual está dentro da Janela Comercial (08:00 às 21:00 de Brasília)
   */
  public isWithinCommercialHours(): boolean {
    const now = new Date();
    // Horário de Brasília (UTC-3)
    const utcHour = now.getUTCHours();
    const brHour = (utcHour - 3 + 24) % 24;

    return brHour >= 8 && brHour < 21;
  }

  /**
   * Pacing Gaussiano Realista: Gera atraso com distribuição normal (sino de Gauss)
   * Evita padrões repetitivos ou fixos (ex: 0.8s) que acionam os algoritmos de ban da Meta.
   */
  public getGaussianDelay(minSec = 15, maxSec = 45): number {
    const mean = (minSec + maxSec) / 2;
    const stdDev = (maxSec - minSec) / 6;

    // Transformada de Box-Muller para distribuição normal
    const u1 = Math.max(1e-6, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    const delay = Math.round(mean + z * stdDev);
    return Math.max(minSec, Math.min(maxSec, delay));
  }

  /**
   * Parser Recursivo de Spintax: Transforma templates com variações {Olá|Oi|Tudo bem}
   * Exemplo: "{Olá|Oi}, {como vai|tudo bem}? Vi que seu {carrinho|pedido} está pendente."
   */
  public parseSpintax(template: string): string {
    if (!template) return "";

    const regex = /\{([^{}]+)\}/g;
    let result = template;

    while (regex.test(result)) {
      result = result.replace(regex, (_, choices) => {
        const parts = choices.split("|");
        return parts[Math.floor(Math.random() * parts.length)];
      });
    }

    return result;
  }

  /**
   * Verifica se o chip precisa de um Coffee Break (Pausa de 10-15 minutos a cada 25 mensagens)
   */
  public checkCoffeeBreak(instanceKey: string): { isBreakNeeded: boolean; breakMinutes: number } {
    const state = this.instanceCounters.get(instanceKey) || { sentCount: 0, lastSentAt: Date.now() };
    const isBreakNeeded = state.sentCount > 0 && state.sentCount % 25 === 0;

    return {
      isBreakNeeded,
      breakMinutes: isBreakNeeded ? 12 : 0,
    };
  }

  /**
   * Prepara o plano de disparo inteligente para uma mensagem
   */
  public planDispatch(params: {
    instanceKey: string;
    rawText: string;
    leadName?: string;
  }): SendGateDispatchPlan {
    const instance = mockDb.whatsappInstances.find((i) => i.instanceKey === params.instanceKey);

    // 1. Bloqueio Preventivo: Chip Desconectado ou Quarentenado
    if (!instance || instance.status === "DISCONNECTED" || instance.status === "QUARANTINED") {
      logger.warn({ instanceKey: params.instanceKey }, "SendGate: Chip desconectado. Fila bloqueada preventivamente.");
      return {
        messageText: params.rawText,
        delaySeconds: 0,
        isCoffeeBreak: false,
        canSendNow: false,
        reason: "Chip desconectado ou em risco de ban. Fila pausada para proteger reputação do número.",
      };
    }

    // 2. Proteção de Horário Anti-Invasão (08h às 21h)
    const inCommercial = this.isWithinCommercialHours();
    if (!inCommercial) {
      const tomorrow8am = new Date();
      tomorrow8am.setDate(tomorrow8am.getDate() + 1);
      tomorrow8am.setHours(8, 5, 0, 0);

      logger.info({ instanceKey: params.instanceKey }, "SendGate: Fora do horário comercial. Agendando para as 08:05.");
      return {
        messageText: this.parseSpintax(params.rawText),
        delaySeconds: 0,
        isCoffeeBreak: false,
        canSendNow: false,
        scheduledFor: tomorrow8am.toISOString(),
        reason: "Fora do horário comercial (08h-21h). Mensagem agendada automaticamente para amanhã às 08:05.",
      };
    }

    // 3. Spintax e Variáveis
    let parsed = this.parseSpintax(params.rawText);
    if (params.leadName) {
      parsed = parsed.replace(/\{nome\}/gi, params.leadName.split(" ")[0]);
    }

    // 4. Coffee Break Check
    const { isBreakNeeded, breakMinutes } = this.checkCoffeeBreak(params.instanceKey);

    // 5. Pacing Gaussiano
    const delay = isBreakNeeded ? breakMinutes * 60 : this.getGaussianDelay(15, 45);

    // Atualizar contador da instância
    const current = this.instanceCounters.get(params.instanceKey) || { sentCount: 0, lastSentAt: Date.now() };
    this.instanceCounters.set(params.instanceKey, {
      sentCount: current.sentCount + 1,
      lastSentAt: Date.now(),
    });

    return {
      messageText: parsed,
      delaySeconds: delay,
      isCoffeeBreak: isBreakNeeded,
      canSendNow: true,
      reason: isBreakNeeded
        ? `Coffee Break Anti-Ban ativado: pausa preventiva de ${breakMinutes} minutos.`
        : `Pacing Gaussiano: jitter seguro de ${delay}s calculado.`,
    };
  }
}

export const sendGateService = new SendGateService();
