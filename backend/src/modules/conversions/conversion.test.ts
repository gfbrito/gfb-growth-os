/**
 * GFB Growth OS — Bateria de Testes Automatizados dos 8 Critérios de Aceite
 * Validação rigorosa do módulo de Conversões de WhatsApp & Negócios Locais
 */

import assert from "node:assert/strict";

// Global BigInt JSON serialization support
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import { mockDb, MockLead, MockClient } from "../../services/mockDb.js";
import { identityService } from "../../services/identityService.js";
import { buildMetaUserData, sha256 } from "../tracking/normalize.js";
import { ruleEngineService } from "./ruleEngine.service.js";
import { conversionRouterService } from "./conversionRouter.service.js";
import { leadOriginCaptureService } from "./whatsappAdapter.service.js";
import { createDefaultLocalBusinessRules, ConversionRule } from "./conversion.types.js";

async function runAcceptanceCriteriaTests() {
  console.log("==========================================================");
  console.log("▶ Iniciando Testes Automatizados dos 8 Critérios de Aceite");
  console.log("==========================================================\n");

  // -------------------------------------------------------------
  // CRITÉRIO 1: Payloads do fluxo de infoproduto idênticos aos de antes da mudança
  // -------------------------------------------------------------
  console.log("Testando Critério 1: Integridade dos Payloads de Infoproduto...");
  const purchaseParams = {
    clientId: "cli_bruna_ppp",
    customerName: "Aluno Verificacao Final",
    customerEmail: "aluno.final@teste.com",
    customerPhone: "+5511991234567",
    productName: "Treinamento Completo Growth",
    amountCents: BigInt(149700),
    platform: "KIWIFY" as const,
    externalOrderId: "ord_final_999",
    fbp: "fb.1.1710000000.555555",
    fbc: "fb.1.1710000000.IwAR_ABC",
    ip: "189.40.120.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    utms: { utm_source: "google_ads", utm_campaign: "campanha_escala" },
  };

  const purchaseResult = identityService.processApprovedPurchase(purchaseParams);
  const webPayload = purchaseResult.capiPayload;

  assert.equal(webPayload.event_name, "Purchase");
  assert.equal(webPayload.event_id, "capi_pur_ord_final_999");
  assert.equal(webPayload.custom_data.value, 1497);
  assert.equal(webPayload.custom_data.currency, "BRL");
  assert.deepEqual(webPayload.user_data.em, [identityService.sha256("aluno.final@teste.com")]);
  assert.deepEqual(webPayload.user_data.ph, [identityService.sha256("+5511991234567")]);
  assert.equal(webPayload.user_data.fbp, "fb.1.1710000000.555555");
  assert.equal(webPayload.user_data.fbc, "fb.1.1710000000.IwAR_ABC");
  console.log("  ✔ Critério 1 Aprovado: Payloads de infoproduto idênticos e preservados.");

  // -------------------------------------------------------------
  // CRITÉRIO 2: Cliente existente migrado continua INFOPRODUTOR, flag desligada e zero evento novo saindo
  // -------------------------------------------------------------
  console.log("\nTestando Critério 2: Clientes existentes INFOPRODUTOR com flag desligada...");
  const brunaClient = mockDb.clients.find((c) => c.id === "cli_bruna_ppp")!;
  const theodoroClient = mockDb.clients.find((c) => c.id === "cli_theodoro")!;

  assert.equal(brunaClient.businessType, "INFOPRODUTOR");
  assert.equal(brunaClient.conversionTrackingEnabled, false);
  assert.equal(theodoroClient.businessType, "INFOPRODUTOR");
  assert.equal(theodoroClient.conversionTrackingEnabled, false);

  // Tentativa de avaliação em cliente com flag desligada
  const dummyLead: MockLead = {
    id: "lead_dummy_infoprodutor",
    clientId: "cli_bruna_ppp",
    name: "Lead Infoprodutor",
    email: "lead@info.com",
    phone: "+5511999990001",
    temperature: "WARM",
    stage: "LEAD",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
  };

  const resultsInfo = await ruleEngineService.evaluateMessage({
    clientId: "cli_bruna_ppp",
    lead: dummyLead,
    messageText: "Quero fazer um orçamento e fechar agora",
    sender: "LEAD",
  });

  assert.equal(resultsInfo.length, 0, "Nenhum evento deve ser gerado quando flag estiver desligada");
  console.log("  ✔ Critério 2 Aprovado: Cliente existente é INFOPRODUTOR e zero evento sai.");

  // -------------------------------------------------------------
  // SETUP PARA TESTES DE NEGÓCIO LOCAL
  // -------------------------------------------------------------
  const localClient = mockDb.clients.find((c) => c.id === "cli_sorriso_local")!;
  assert.equal(localClient.businessType, "NEGOCIO_LOCAL");
  assert.equal(localClient.conversionTrackingEnabled, true);

  // -------------------------------------------------------------
  // CRITÉRIO 3: Mesma palavra-chave recebida três vezes do mesmo lead gera um único envio
  // -------------------------------------------------------------
  console.log("\nTestando Critério 3: Deduplicação de palavra-chave por ciclo...");
  const leadC3: MockLead = {
    id: `lead_c3_${Date.now()}`,
    clientId: localClient.id,
    name: "Lead Teste C3",
    email: "lead_c3@teste.com",
    phone: "+5511988880003",
    temperature: "WARM",
    stage: "LEAD",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
    currentCycle: 1,
    ctwaClid: "ctwa_clid_12345", // Possui identificador CTWA
  };
  mockDb.leads.push(leadC3);

  // Envio 1: Mensagem com palavra-chave "orçamento" (Regra: QualifiedLead)
  const eval1 = await ruleEngineService.evaluateMessage({
    clientId: localClient.id,
    lead: leadC3,
    messageText: "Gostaria de um orçamento detalhado para o tratamento",
    sender: "LEAD",
  });
  const qualTriggered1 = eval1.filter((r) => r.metaEvent === "QualifiedLead" && r.triggered);
  assert.equal(qualTriggered1.length, 1, "Primeiro envio da palavra-chave deve disparar QualifiedLead");

  // Envio 2: Mesma palavra-chave repetida
  const eval2 = await ruleEngineService.evaluateMessage({
    clientId: localClient.id,
    lead: leadC3,
    messageText: "Me passa o orçamento por favor",
    sender: "LEAD",
  });
  const qualTriggered2 = eval2.filter((r) => r.metaEvent === "QualifiedLead" && r.triggered);
  assert.equal(qualTriggered2.length, 0, "Segundo envio deve ser ignorado pela trava de unicidade");

  // Envio 3: Terceira repetição
  const eval3 = await ruleEngineService.evaluateMessage({
    clientId: localClient.id,
    lead: leadC3,
    messageText: "Ainda aguardo o orçamento",
    sender: "LEAD",
  });
  const qualTriggered3 = eval3.filter((r) => r.metaEvent === "QualifiedLead" && r.triggered);
  assert.equal(qualTriggered3.length, 0, "Terceiro envio deve ser ignorado pela trava de unicidade");
  console.log("  ✔ Critério 3 Aprovado: Mesma palavra-chave recebida 3x gerou exatamente 1 envio de QualifiedLead.");

  // -------------------------------------------------------------
  // CRITÉRIO 4: Lead movido para 'Proposta' gera um evento, não vários
  // -------------------------------------------------------------
  console.log("\nTestando Critério 4: Mover etapa dispara apenas evento principal...");
  const leadC4: MockLead = {
    id: `lead_c4_${Date.now()}`,
    clientId: localClient.id,
    name: "Lead Teste C4",
    email: "lead_c4@teste.com",
    phone: "+5511988880004",
    temperature: "WARM",
    stage: "Qualificado",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
    currentCycle: 1,
    ctwaClid: "ctwa_clid_proposta_99",
  };
  mockDb.leads.push(leadC4);

  const stageResult = await ruleEngineService.handleStageChanged({
    clientId: localClient.id,
    lead: leadC4,
    newStage: "Proposta",
  });

  assert.ok(stageResult, "Deve retornar o resultado do evento disparado");
  assert.equal(stageResult.metaEvent, "InitiateCheckout", "Evento disparado deve ser o principal InitiateCheckout");
  assert.equal(stageResult.triggered, true);
  console.log("  ✔ Critério 4 Aprovado: Mover lead para Proposta gerou 1 único evento.");

  // -------------------------------------------------------------
  // CRITÉRIO 5: Purchase sem valor ou sem confirmação não sai e cai na fila de revisão
  // -------------------------------------------------------------
  console.log("\nTestando Critério 5: Trava de Purchase sem valor ou sem confirmação...");
  const leadC5: MockLead = {
    id: `lead_c5_${Date.now()}`,
    clientId: localClient.id,
    name: "Lead Teste C5",
    email: "lead_c5@teste.com",
    phone: "+5511988880005",
    temperature: "WARM",
    stage: "Proposta",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
    currentCycle: 1,
    ctwaClid: "ctwa_pur_11",
  };
  mockDb.leads.push(leadC5);

  const prevQueueLength = mockDb.conversionReviewQueue.length;

  // Envia mensagem indicando fechamento com palavra-chave ("pago"), porém SEM valor explícito e SEM confirmação
  const evalPurchaseNoValue = await ruleEngineService.evaluateMessage({
    clientId: localClient.id,
    lead: leadC5,
    messageText: "Já está pago, obrigado!",
    sender: "LEAD",
    forceConfirmation: false,
  });

  const purResult = evalPurchaseNoValue.find((r) => r.metaEvent === "Purchase");
  assert.ok(purResult, "Regra de Purchase deve ter sido avaliada");
  assert.equal(purResult.triggered, false, "Purchase sem valor não pode disparar");
  assert.equal(purResult.sentToReviewQueue, true, "Deve ser encaminhado para a fila de revisão");
  assert.equal(mockDb.conversionReviewQueue.length, prevQueueLength + 1, "Fila de revisão deve ter recebido 1 novo item");
  console.log("  ✔ Critério 5 Aprovado: Purchase sem valor/confirmação bloqueado e encaminhado à fila.");

  // -------------------------------------------------------------
  // CRITÉRIO 6: Decisão de Roteador por Lead (CTWA, Web fbc e Sem Identificador)
  // -------------------------------------------------------------
  console.log("\nTestando Critério 6: Roteamento por lead (CTWA vs Web vs Sem Identificador)...");
  const testRule: ConversionRule = {
    id: "rule_test_router",
    clientId: localClient.id,
    name: "Regra Roteador Teste",
    isActive: true,
    stage: "Proposta",
    metaEvent: "InitiateCheckout",
    keywords: [],
    allowedSender: "BOTH",
    defaultValueCents: BigInt(50000),
    extractValueFromMessage: false,
    dashboardMetric: "NONE",
    closesCycle: false,
    requiresConfirmation: false,
  };

  // 6A: Lead com ctwa_clid
  const leadCtwa: MockLead = {
    id: "lead_router_ctwa",
    clientId: localClient.id,
    name: "Lead CTWA",
    email: "ctwa@teste.com",
    phone: "+5511977771111",
    temperature: "WARM",
    stage: "Proposta",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
    ctwaClid: "ctwa_clid_exemplo_777",
  };
  const resCtwa = await conversionRouterService.routeAndDispatch({
    client: localClient,
    lead: leadCtwa,
    rule: testRule,
    cycle: 1,
    amountCents: BigInt(50000),
  });
  assert.equal(resCtwa.rail, "BUSINESS_MESSAGING", "Lead com ctwa_clid deve ir para o trilho BUSINESS_MESSAGING");

  // 6B: Lead com fbc do clique no site
  const leadWeb: MockLead = {
    id: "lead_router_web",
    clientId: localClient.id,
    name: "Lead Web",
    email: "web@teste.com",
    phone: "+5511977772222",
    temperature: "WARM",
    stage: "Proposta",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
    fbc: "fb.1.1710000000.IwAR_SITE_CLICK",
    fbp: "fb.1.1710000000.999888",
  };
  const resWeb = await conversionRouterService.routeAndDispatch({
    client: localClient,
    lead: leadWeb,
    rule: testRule,
    cycle: 1,
    amountCents: BigInt(50000),
  });
  assert.equal(resWeb.rail, "WEB_REUSED", "Lead com fbc deve ir para o trilho WEB_REUSED");

  // 6C: Lead sem nenhum identificador
  const leadUntracked: MockLead = {
    id: "lead_router_untracked",
    clientId: localClient.id,
    name: "Lead Orgânico Direto",
    email: "organico@teste.com",
    phone: "+5511977773333",
    temperature: "WARM",
    stage: "Proposta",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
  };
  const resUntracked = await conversionRouterService.routeAndDispatch({
    client: localClient,
    lead: leadUntracked,
    rule: testRule,
    cycle: 1,
    amountCents: BigInt(50000),
  });
  assert.equal(resUntracked.rail, "UNTRACKED");
  assert.equal(resUntracked.delivered, false, "Lead sem identificador não deve ser enviado para a Meta");

  const lastAuditLog = mockDb.conversionAuditLogs[0];
  assert.equal(lastAuditLog.status, "NOT_SENT");
  assert.match(lastAuditLog.reason || "", /Sem identificador/);
  console.log("  ✔ Critério 6 Aprovado: Roteador segmenta estritamente CTWA vs Web vs Não enviado.");

  // -------------------------------------------------------------
  // CRITÉRIO 7: Em modo simulação nada chega à Meta
  // -------------------------------------------------------------
  console.log("\nTestando Critério 7: Modo simulação ativado por padrão...");
  assert.equal(localClient.simulationMode, true, "Modo simulação deve estar ativado");

  const resSimulation = await conversionRouterService.routeAndDispatch({
    client: localClient,
    lead: leadCtwa,
    rule: testRule,
    cycle: 1,
    amountCents: BigInt(50000),
  });

  assert.equal(resSimulation.simulated, true, "Resultado deve ser marcado como simulado");
  assert.equal(resSimulation.delivered, false, "Nada deve ter sido entregue externamente à Meta");
  console.log("  ✔ Critério 7 Aprovado: Em modo simulação nada é transmitido externamente.");

  // -------------------------------------------------------------
  // CRITÉRIO 8: Mensagem do atendente não dispara regra marcada como 'apenas o lead'
  // -------------------------------------------------------------
  console.log("\nTestando Critério 8: Restrição de emissor permitido...");
  const leadRuleOnlyLead: ConversionRule = {
    id: "rule_lead_only",
    clientId: localClient.id,
    name: "Dúvida do Cliente",
    isActive: true,
    stage: "Em Atendimento",
    metaEvent: "ViewContent",
    keywords: ["dúvida", "informação", "serviço"],
    allowedSender: "LEAD", // APENAS O LEAD
    defaultValueCents: BigInt(0),
    extractValueFromMessage: false,
    dashboardMetric: "NONE",
    closesCycle: false,
    requiresConfirmation: false,
  };
  mockDb.conversionRules.push(leadRuleOnlyLead);

  const leadC8: MockLead = {
    id: `lead_c8_${Date.now()}`,
    clientId: localClient.id,
    name: "Lead Teste C8",
    email: "lead_c8@teste.com",
    phone: "+5511966660008",
    temperature: "WARM",
    stage: "Em Atendimento",
    rfmPoints: 10,
    totalSpentCents: BigInt(0),
    purchaseCount: 0,
    lastSeen: new Date().toISOString(),
    ctwaClid: "ctwa_c8",
  };
  mockDb.leads.push(leadC8);

  // Atendente enviando mensagem contendo a palavra-chave
  const evalAttendant = await ruleEngineService.evaluateMessage({
    clientId: localClient.id,
    lead: leadC8,
    messageText: "Olá, tirei sua dúvida sobre o nosso serviço!",
    sender: "ATTENDANT", // Mensagem do atendente
  });

  const ruleEval = evalAttendant.find((r) => r.ruleId === "rule_lead_only");
  assert.equal(ruleEval, undefined, "Mensagem do atendente NÃO deve disparar regra marcada como apenas lead");
  console.log("  ✔ Critério 8 Aprovado: Mensagem do atendente não disparou regra de lead.");

  console.log("\n==========================================================");
  console.log("🎉 TODOS OS 8 CRITÉRIOS DE ACEITE PASSARAM COM SUCESSO!");
  console.log("==========================================================\n");
}

runAcceptanceCriteriaTests().catch((err) => {
  console.error("❌ Falha na bateria de testes dos critérios de aceite:", err);
  process.exit(1);
});
