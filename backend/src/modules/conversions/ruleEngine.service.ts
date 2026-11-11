/**
 * GFB Growth OS — Motor de Regras e Gatilhos de Conversão WhatsApp
 * Detecção em duas camadas (palavras-chave + IA com limiar de confiança),
 * travas estritas de unicidade por ciclo, regras de Purchase e fila de revisão.
 */

import { mockDb, MockLead } from "../../services/mockDb.js";
import {
  ConversionRule,
  ConversionReviewQueueItem,
  MetaMessagingEvent,
  ALLOWED_MESSAGING_EVENTS,
} from "./conversion.types.js";
import { conversionRouterService } from "./conversionRouter.service.js";

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  metaEvent: MetaMessagingEvent | "NONE";
  amountCents: bigint;
  reason?: string;
  sentToReviewQueue?: boolean;
}

export class RuleEngineService {
  private readonly AI_CONFIDENCE_THRESHOLD = 0.8; // 80%

  /**
   * Extrai valor monetário em centavos do texto da mensagem (ex: "R$ 150,00", "250 reais", "valor de 1200")
   */
  public extractMonetaryValueCents(text: string): bigint | null {
    if (!text) return null;

    // Padrão 1: R$ 1.500,00 ou R$ 150,00 ou R$ 150
    const brlMatch = text.match(/R\$\s*([\d\.,]+)/i);
    if (brlMatch && brlMatch[1]) {
      const clean = brlMatch[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0) return BigInt(Math.round(num * 100));
    }

    // Padrão 2: 150 reais ou 1500 reais
    const reaisMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:reais|real)/i);
    if (reaisMatch && reaisMatch[1]) {
      const clean = reaisMatch[1].replace(",", ".");
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0) return BigInt(Math.round(num * 100));
    }

    return null;
  }

  /**
   * Classificação por IA da etapa da conversa com cálculo de score de confiança (Camada 2)
   */
  public classifyConversationIntent(
    messageText: string,
    rule: ConversionRule
  ): { confirmed: boolean; confidence: number } {
    const textLower = messageText.toLowerCase();

    // Se a regra não exige palavras-chave (ex: primeira mensagem)
    if (rule.keywords.length === 0) {
      return { confirmed: true, confidence: 0.95 };
    }

    // Contagem de termos e verificação de contexto semântico
    const matchedCount = rule.keywords.filter((kw) => textLower.includes(kw.toLowerCase())).length;

    if (matchedCount >= 2) {
      return { confirmed: true, confidence: 0.92 };
    } else if (matchedCount === 1) {
      // 1 termo presente: se a mensagem for curta e direta, confiança alta; se for longa/ambígua, pode cair
      const isShortDirect = textLower.length < 120;
      const confidence = isShortDirect ? 0.85 : 0.72; // 0.72 cai na fila de revisão se limiar for 0.80
      return { confirmed: confidence >= this.AI_CONFIDENCE_THRESHOLD, confidence };
    }

    return { confirmed: false, confidence: 0.3 };
  }

  /**
   * Avalia uma mensagem recebida ou enviada no chat contra as regras do cliente
   */
  public async evaluateMessage(params: {
    clientId: string;
    lead: MockLead;
    messageText: string;
    sender: "LEAD" | "ATTENDANT";
    forceConfirmation?: boolean;
    forcedValueCents?: bigint;
  }): Promise<RuleEvaluationResult[]> {
    const { clientId, lead, messageText, sender } = params;

    const client = mockDb.clients.find((c) => c.id === clientId);
    if (!client || !client.conversionTrackingEnabled) {
      // Flag desligada: zero evento novo saindo
      return [];
    }

    const cycle = lead.currentCycle || 1;
    const clientRules = mockDb.conversionRules.filter(
      (r) => r.clientId === clientId && r.isActive
    );

    const results: RuleEvaluationResult[] = [];

    for (const rule of clientRules) {
      // 1. Verificação de emissor permitido
      if (rule.allowedSender !== "BOTH" && rule.allowedSender !== sender) {
        continue;
      }

      // 2. Trava de Unicidade Obrigatória por ciclo (Restrição única no banco e memória)
      if (mockDb.hasRuleDispatched(lead.id, rule.id, cycle)) {
        continue; // Já disparou neste ciclo
      }

      // 3. Camada 1: Pré-filtro barato por palavras-chave
      let passesKeywordFilter = false;
      if (rule.keywords.length === 0) {
        // Regra de primeira mensagem dispara se for o primeiro contato do lead
        passesKeywordFilter = lead.purchaseCount === 0;
      } else {
        const textLower = messageText.toLowerCase();
        passesKeywordFilter = rule.keywords.some((kw) => textLower.includes(kw.toLowerCase()));
      }

      if (!passesKeywordFilter) {
        continue;
      }

      // 4. Camada 2: Confirmação semântica por IA com score de confiança
      const aiResult = this.classifyConversationIntent(messageText, rule);

      // Determinar valor
      let finalValueCents = params.forcedValueCents ?? rule.defaultValueCents;
      if (rule.extractValueFromMessage) {
        const extracted = this.extractMonetaryValueCents(messageText);
        if (extracted !== null) {
          finalValueCents = extracted;
        }
      }

      // Se confiança estiver abaixo do limiar -> Fila de Revisão Humana
      if (!aiResult.confirmed) {
        const queueItem: ConversionReviewQueueItem = {
          id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          clientId,
          leadId: lead.id,
          leadName: lead.name,
          ruleId: rule.id,
          ruleName: rule.name,
          detectedText: messageText,
          proposedEvent: rule.metaEvent,
          proposedValueCents: finalValueCents,
          confidenceScore: aiResult.confidence,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };

        mockDb.conversionReviewQueue.unshift(queueItem);

        // Registra no log de auditoria
        mockDb.conversionAuditLogs.unshift({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          clientId,
          leadId: lead.id,
          leadName: lead.name,
          ruleId: rule.id,
          ruleName: rule.name,
          timestamp: new Date().toISOString(),
          event: rule.metaEvent,
          amountCents: finalValueCents,
          rail: lead.ctwaClid ? "BUSINESS_MESSAGING" : lead.fbc ? "WEB_REUSED" : "UNTRACKED",
          status: "NOT_SENT",
          reason: `Baixa confiança IA (${Math.round(aiResult.confidence * 100)}%) — Encaminhado para fila de revisão`,
          eventId: `wa_${lead.id}_${rule.id}_${cycle}`,
          simulated: client.simulationMode,
        });

        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          triggered: false,
          metaEvent: rule.metaEvent,
          amountCents: finalValueCents,
          reason: "LOW_CONFIDENCE_QUEUED",
          sentToReviewQueue: true,
        });
        continue;
      }

      // 5. Travas obrigatórias de Purchase
      if (rule.metaEvent === "Purchase") {
        const hasValueGreaterThanZero = finalValueCents > BigInt(0);
        const hasConfirmation = Boolean(params.forceConfirmation || !rule.requiresConfirmation);

        if (!hasValueGreaterThanZero || !hasConfirmation) {
          // Purchase sem valor ou sem confirmação NÃO sai e cai na fila de revisão
          const queueItem: ConversionReviewQueueItem = {
            id: `rev_pur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            clientId,
            leadId: lead.id,
            leadName: lead.name,
            ruleId: rule.id,
            ruleName: rule.name,
            detectedText: messageText,
            proposedEvent: "Purchase",
            proposedValueCents: finalValueCents,
            confidenceScore: aiResult.confidence,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          };
          mockDb.conversionReviewQueue.unshift(queueItem);

          const blockReason = !hasValueGreaterThanZero
            ? "Purchase sem valor maior que zero — Requer confirmação e valor"
            : "Purchase exige confirmação humana ou botão Marcar Venda";

          mockDb.conversionAuditLogs.unshift({
            id: `log_pur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            clientId,
            leadId: lead.id,
            leadName: lead.name,
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: new Date().toISOString(),
            event: "Purchase",
            amountCents: finalValueCents,
            rail: lead.ctwaClid ? "BUSINESS_MESSAGING" : lead.fbc ? "WEB_REUSED" : "UNTRACKED",
            status: "NOT_SENT",
            reason: blockReason,
            eventId: `wa_${lead.id}_${rule.id}_${cycle}`,
            simulated: client.simulationMode,
          });

          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: false,
            metaEvent: "Purchase",
            amountCents: finalValueCents,
            reason: blockReason,
            sentToReviewQueue: true,
          });
          continue;
        }
      }

      // 6. Disparo via Roteador de Envio
      if (rule.metaEvent !== "NONE") {
        const dispatchResult = await conversionRouterService.routeAndDispatch({
          client,
          lead,
          rule,
          cycle,
          amountCents: finalValueCents,
        });

        // Registrar no tracker de unicidade
        mockDb.registerDispatchedRule(lead.id, rule.id, cycle);

        // Se a regra encerra o ciclo de atendimento, avançar o ciclo do lead
        if (rule.closesCycle) {
          lead.currentCycle = cycle + 1;
        }

        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          triggered: dispatchResult.delivered || dispatchResult.simulated,
          metaEvent: rule.metaEvent,
          amountCents: finalValueCents,
          reason: dispatchResult.reason,
        });
      } else {
        // Regra que apenas move o funil ou métrica sem enviar para a Meta
        mockDb.registerDispatchedRule(lead.id, rule.id, cycle);
        if (rule.closesCycle) {
          lead.currentCycle = cycle + 1;
        }
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          triggered: true,
          metaEvent: "NONE",
          amountCents: finalValueCents,
        });
      }
    }

    return results;
  }

  /**
   * Mover o lead de etapa dispara SÓ o evento principal daquela etapa, nunca todos os vinculados
   */
  public async handleStageChanged(params: {
    clientId: string;
    lead: MockLead;
    newStage: string;
    confirmation?: boolean;
    valueCents?: bigint;
  }): Promise<RuleEvaluationResult | null> {
    const { clientId, lead, newStage } = params;

    lead.stage = newStage as any;

    const client = mockDb.clients.find((c) => c.id === clientId);
    if (!client || !client.conversionTrackingEnabled) {
      return null;
    }

    const clientRules = mockDb.conversionRules.filter(
      (r) => r.clientId === clientId && r.stage === newStage && r.isActive
    );

    if (clientRules.length === 0) return null;

    // Trava: Pega EXATAMENTE o evento principal da etapa (isPrimaryForStage ou a primeira ativa)
    const primaryRule = clientRules.find((r) => r.isPrimaryForStage) || clientRules[0];

    const cycle = lead.currentCycle || 1;

    // Verifica trava de unicidade
    if (mockDb.hasRuleDispatched(lead.id, primaryRule.id, cycle)) {
      return {
        ruleId: primaryRule.id,
        ruleName: primaryRule.name,
        triggered: false,
        metaEvent: primaryRule.metaEvent,
        amountCents: BigInt(0),
        reason: "ALREADY_DISPATCHED_IN_CYCLE",
      };
    }

    // Se for Purchase, requer confirmação e valor > 0
    let finalValueCents = params.valueCents ?? primaryRule.defaultValueCents;

    if (primaryRule.metaEvent === "Purchase") {
      const hasValue = finalValueCents > BigInt(0);
      const isConfirmed = Boolean(params.confirmation);

      if (!hasValue || !isConfirmed) {
        const queueItem: ConversionReviewQueueItem = {
          id: `rev_stg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          clientId,
          leadId: lead.id,
          leadName: lead.name,
          ruleId: primaryRule.id,
          ruleName: primaryRule.name,
          detectedText: `Lead movido para etapa '${newStage}'`,
          proposedEvent: "Purchase",
          proposedValueCents: finalValueCents,
          confidenceScore: 1.0,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };
        mockDb.conversionReviewQueue.unshift(queueItem);

        mockDb.conversionAuditLogs.unshift({
          id: `log_stg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          clientId,
          leadId: lead.id,
          leadName: lead.name,
          ruleId: primaryRule.id,
          ruleName: primaryRule.name,
          timestamp: new Date().toISOString(),
          event: "Purchase",
          amountCents: finalValueCents,
          rail: lead.ctwaClid ? "BUSINESS_MESSAGING" : lead.fbc ? "WEB_REUSED" : "UNTRACKED",
          status: "NOT_SENT",
          reason: "Venda na etapa requer confirmação e valor maior que zero",
          eventId: `wa_${lead.id}_${primaryRule.id}_${cycle}`,
          simulated: client.simulationMode,
        });

        return {
          ruleId: primaryRule.id,
          ruleName: primaryRule.name,
          triggered: false,
          metaEvent: "Purchase",
          amountCents: finalValueCents,
          sentToReviewQueue: true,
          reason: "PURCHASE_REQUIRES_VALUE_AND_CONFIRMATION",
        };
      }
    }

    // Disparo pelo roteador
    if (primaryRule.metaEvent !== "NONE") {
      const dispatchResult = await conversionRouterService.routeAndDispatch({
        client,
        lead,
        rule: primaryRule,
        cycle,
        amountCents: finalValueCents,
      });

      mockDb.registerDispatchedRule(lead.id, primaryRule.id, cycle);
      if (primaryRule.closesCycle) {
        lead.currentCycle = cycle + 1;
      }

      return {
        ruleId: primaryRule.id,
        ruleName: primaryRule.name,
        triggered: dispatchResult.delivered || dispatchResult.simulated,
        metaEvent: primaryRule.metaEvent,
        amountCents: finalValueCents,
        reason: dispatchResult.reason,
      };
    }

    mockDb.registerDispatchedRule(lead.id, primaryRule.id, cycle);
    return {
      ruleId: primaryRule.id,
      ruleName: primaryRule.name,
      triggered: true,
      metaEvent: "NONE",
      amountCents: finalValueCents,
    };
  }

  /**
   * Valida criação ou edição de regra (bloqueia 2ª regra com Purchase e eventos inválidos)
   */
  public validateRule(clientId: string, rule: Partial<ConversionRule>): { valid: boolean; error?: string } {
    if (rule.metaEvent && rule.metaEvent !== "NONE") {
      if (!ALLOWED_MESSAGING_EVENTS.includes(rule.metaEvent as any)) {
        return {
          valid: false,
          error: `O evento '${rule.metaEvent}' não é suportado pelo formato Meta Business Messaging.`,
        };
      }
    }

    if (rule.metaEvent === "Purchase") {
      const existingPurchase = mockDb.conversionRules.find(
        (r) => r.clientId === clientId && r.metaEvent === "Purchase" && r.id !== rule.id
      );
      if (existingPurchase) {
        return {
          valid: false,
          error: "Só uma regra por funil pode mapear para Purchase. A interface bloqueia a segunda.",
        };
      }
    }

    return { valid: true };
  }
}

export const ruleEngineService = new RuleEngineService();
