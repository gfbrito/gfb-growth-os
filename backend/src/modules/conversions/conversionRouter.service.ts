/**
 * GFB Growth OS — Roteador de Envio CAPI (Decisão por Lead)
 * Roteia eventos de conversão de WhatsApp conforme os identificadores do lead:
 * 1. Com ctwa_clid -> Trilho Business Messaging (action_source: "business_messaging", messaging_channel: "whatsapp")
 * 2. Com fbc/fbp -> Trilho Web reutilizando metaCapiService.sendEventsBatch (chamar, não copiar nem alterar)
 * 3. Sem identificador -> Não envia à Meta, grava log de auditoria
 * 4. Modo Simulação -> Bloqueia envio de rede quando simulationMode === true
 * 5. Idempotência com event_id estável: wa_<leadId>_<ruleId>_<ciclo>
 */

import { mockDb, MockClient, MockLead } from "../../services/mockDb.js";
import { metaCapiService } from "../tracking/capi/metaCapiService.js";
import { sha256, normalizePhoneBR, normalizeEmail } from "../tracking/normalize.js";
import {
  ConversionRule,
  ConversionRail,
  AuditLogStatus,
  ALLOWED_MESSAGING_EVENTS,
} from "./conversion.types.js";
import { logger } from "../../utils/logger.js";

export interface RouteAndDispatchParams {
  client: MockClient;
  lead: MockLead;
  rule: ConversionRule;
  cycle: number;
  amountCents: bigint;
  testEventCode?: string;
}

export interface RouteAndDispatchResult {
  eventId: string;
  rail: ConversionRail;
  delivered: boolean;
  simulated: boolean;
  reason?: string;
  metaPayload?: any;
  metaResponse?: any;
}

export class ConversionRouterService {
  /**
   * Constrói o event_id determinístico e estável
   * Regra: wa_<leadId>_<ruleId>_<ciclo> (reenvios usam o mesmo id para garantir idempotência)
   */
  public generateEventId(leadId: string, ruleId: string, cycle: number): string {
    return `wa_${leadId}_${ruleId}_${cycle}`;
  }

  /**
   * Decide o trilho de envio e despacha o evento
   */
  public async routeAndDispatch(params: RouteAndDispatchParams): Promise<RouteAndDispatchResult> {
    const { client, lead, rule, cycle, amountCents, testEventCode } = params;
    const eventId = this.generateEventId(lead.id, rule.id, cycle);

    // Validação de evento suportado
    if (!ALLOWED_MESSAGING_EVENTS.includes(rule.metaEvent as any)) {
      const reason = `Evento '${rule.metaEvent}' não é suportado pelo formato Meta Business Messaging`;
      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "UNTRACKED",
        status: "NOT_SENT",
        reason,
        simulated: client.simulationMode,
      });
      return { eventId, rail: "UNTRACKED", delivered: false, simulated: false, reason };
    }

    // Decisão do Trilho:
    // Trilho 1: Lead com ctwa_clid -> Formato Business Messaging
    if (lead.ctwaClid) {
      return await this.dispatchBusinessMessaging({
        client,
        lead,
        rule,
        cycle,
        eventId,
        amountCents,
        testEventCode,
      });
    }

    // Trilho 2: Lead com fbc ou fbp do clique no site -> Formato Web reutilizado
    if (lead.fbc || lead.fbp || lead.clickTrackingCode) {
      return await this.dispatchWebReused({
        client,
        lead,
        rule,
        cycle,
        eventId,
        amountCents,
        testEventCode,
      });
    }

    // Trilho 3: Lead sem identificador -> Não envia para a Meta
    const reason = "Sem identificador (ausência de ctwa_clid e de cookies fbc/fbp)";
    this.recordAuditLog({
      client,
      lead,
      rule,
      eventId,
      amountCents,
      rail: "UNTRACKED",
      status: "NOT_SENT",
      reason,
      simulated: client.simulationMode,
    });

    return {
      eventId,
      rail: "UNTRACKED",
      delivered: false,
      simulated: false,
      reason,
    };
  }

  /**
   * Trilho 1: Formato Meta Business Messaging
   * Documentação oficial: https://developers.facebook.com/docs/marketing-api/conversions-api/business-messaging
   */
  private async dispatchBusinessMessaging(params: {
    client: MockClient;
    lead: MockLead;
    rule: ConversionRule;
    cycle: number;
    eventId: string;
    amountCents: bigint;
    testEventCode?: string;
  }): Promise<RouteAndDispatchResult> {
    const { client, lead, rule, eventId, amountCents } = params;

    // Trava de configuração: precisa de WABA Account ID e Dataset ID
    if (!client.wabaAccountId || !client.wabaDatasetId) {
      const reason = "Trilho não configurado: WhatsApp Business Account ID ou Dataset não configurados no cliente";
      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "BUSINESS_MESSAGING",
        status: "NOT_SENT",
        reason,
        simulated: client.simulationMode,
      });
      return { eventId, rail: "BUSINESS_MESSAGING", delivered: false, simulated: false, reason };
    }

    // Monta payload estritamente compatível com a documentação Meta Business Messaging
    const normPhone = normalizePhoneBR(lead.phone);
    const cleanEmail = normalizeEmail(lead.email);

    const messagingPayload = {
      event_name: rule.metaEvent,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "business_messaging" as const,
      messaging_channel: "whatsapp" as const,
      user_data: {
        ctwa_clid: lead.ctwaClid,
        whatsapp_business_account_id: client.wabaAccountId,
        ph: normPhone ? [sha256(normPhone.replace(/\D/g, ""))] : undefined,
        em: cleanEmail ? [sha256(cleanEmail)] : undefined,
      },
      custom_data: {
        currency: "BRL",
        value: Number(amountCents) / 100,
        content_name: rule.name,
      },
    };

    // Trava de Modo Simulação (Ativo por padrão): nada chega à Meta
    if (client.simulationMode) {
      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "BUSINESS_MESSAGING",
        status: "DELIVERED",
        reason: "Modo Simulação — Payload de Business Messaging gerado sem envio de rede",
        metaResponse: { simulation: true, payload: messagingPayload },
        simulated: true,
      });

      return {
        eventId,
        rail: "BUSINESS_MESSAGING",
        delivered: false,
        simulated: true,
        metaPayload: messagingPayload,
        reason: "SIMULATED_SUCCESS",
      };
    }

    // Em modo produção real: envio ao endpoint do Dataset da Meta
    try {
      const url = `https://graph.facebook.com/v20.0/${client.wabaDatasetId}/events`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [messagingPayload],
          access_token: "MOCK_OR_REAL_TOKEN",
          ...(params.testEventCode ? { test_event_code: params.testEventCode } : {}),
        }),
      });

      const data = await response.json();

      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "BUSINESS_MESSAGING",
        status: response.ok ? "DELIVERED" : "ERROR",
        metaResponse: data,
        simulated: false,
      });

      return {
        eventId,
        rail: "BUSINESS_MESSAGING",
        delivered: response.ok,
        simulated: false,
        metaPayload: messagingPayload,
        metaResponse: data,
      };
    } catch (err: any) {
      logger.error({ err: err.message, eventId }, "Falha no envio de Business Messaging");
      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "BUSINESS_MESSAGING",
        status: "ERROR",
        reason: err.message,
        simulated: false,
      });

      return {
        eventId,
        rail: "BUSINESS_MESSAGING",
        delivered: false,
        simulated: false,
        reason: err.message,
      };
    }
  }

  /**
   * Trilho 2: Formato Web Reutilizando metaCapiService.sendEventsBatch (chamar, não copiar nem alterar)
   */
  private async dispatchWebReused(params: {
    client: MockClient;
    lead: MockLead;
    rule: ConversionRule;
    cycle: number;
    eventId: string;
    amountCents: bigint;
    testEventCode?: string;
  }): Promise<RouteAndDispatchResult> {
    const { client, lead, rule, eventId, amountCents } = params;

    // Se estiver em modo simulação, não faz chamada de rede externa
    if (client.simulationMode) {
      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "WEB_REUSED",
        status: "DELIVERED",
        reason: "Modo Simulação — Chamada Web CAPI Gateway simulada com hashes",
        metaResponse: { simulation: true, eventId },
        simulated: true,
      });

      return {
        eventId,
        rail: "WEB_REUSED",
        delivered: false,
        simulated: true,
        reason: "SIMULATED_SUCCESS",
      };
    }

    try {
      // Reutiliza diretamente a função que já existe no gateway
      const capiResponse = await metaCapiService.sendEventsBatch(
        client.pixelId,
        "CAPI_ACCESS_TOKEN",
        [
          {
            eventName: rule.metaEvent,
            eventId,
            actionSource: "website",
            userData: {
              email: lead.email,
              phone: lead.phone,
              name: lead.name,
              fbp: lead.fbp,
              fbc: lead.fbc,
            },
            customData: {
              currency: "BRL",
              value: Number(amountCents) / 100,
              content_name: rule.name,
            },
          },
        ],
        params.testEventCode
      );

      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "WEB_REUSED",
        status: capiResponse ? "DELIVERED" : "ERROR",
        metaResponse: capiResponse,
        simulated: false,
      });

      return {
        eventId,
        rail: "WEB_REUSED",
        delivered: Boolean(capiResponse),
        simulated: false,
        metaResponse: capiResponse,
      };
    } catch (err: any) {
      this.recordAuditLog({
        client,
        lead,
        rule,
        eventId,
        amountCents,
        rail: "WEB_REUSED",
        status: "ERROR",
        reason: err.message,
        simulated: false,
      });

      return {
        eventId,
        rail: "WEB_REUSED",
        delivered: false,
        simulated: false,
        reason: err.message,
      };
    }
  }

  /**
   * Grava entrada no log de auditoria do cliente
   */
  private recordAuditLog(log: {
    client: MockClient;
    lead: MockLead;
    rule: ConversionRule;
    eventId: string;
    amountCents: bigint;
    rail: ConversionRail;
    status: AuditLogStatus;
    reason?: string;
    metaResponse?: any;
    simulated: boolean;
  }) {
    mockDb.conversionAuditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId: log.client.id,
      leadId: log.lead.id,
      leadName: log.lead.name,
      ruleId: log.rule.id,
      ruleName: log.rule.name,
      timestamp: new Date().toISOString(),
      event: log.rule.metaEvent,
      amountCents: log.amountCents,
      rail: log.rail,
      status: log.status,
      reason: log.reason,
      metaResponse: log.metaResponse,
      eventId: log.eventId,
      simulated: log.simulated,
    });
  }
}

export const conversionRouterService = new ConversionRouterService();
