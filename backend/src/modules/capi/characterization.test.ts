/**
 * Testes de Caracterização — Fluxo de Infoproduto Existente
 * Captura e congela os contratos e esquemas de payload de Purchase e InitiateCheckout
 * para garantir que nenhuma alteração futura cause qualquer regressão.
 */

import assert from "node:assert/strict";

// Global BigInt JSON serialization support
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import { identityService } from "../../services/identityService.js";
import { buildMetaUserData, sha256, normalizePhoneBR } from "../tracking/normalize.js";

async function runCharacterizationTests() {
  console.log("▶ Iniciando Testes de Caracterização do Fluxo de Infoproduto...");

  // -------------------------------------------------------------
  // Teste 1: Contrato do Webhook/Identity de Compra Aprovada (Purchase)
  // -------------------------------------------------------------
  const purchaseParams = {
    clientId: "cli_bruna_ppp",
    customerName: "Aluno Teste Infoproduto",
    customerEmail: "aluno.infoproduto@teste.com",
    customerPhone: "+5511998877665",
    productName: "Curso Avançado de Tráfego",
    amountCents: BigInt(99700),
    platform: "KIWIFY" as const,
    externalOrderId: "ord_caract_12345",
    fbp: "fb.1.1710000000.123456789",
    fbc: "fb.1.1710000000.IwAR0123456789",
    ip: "201.80.10.25",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    utms: {
      utm_source: "instagram",
      utm_campaign: "campanha_infoproduto_escala",
    },
  };

  const purchaseResult = identityService.processApprovedPurchase(purchaseParams);
  const payload = purchaseResult.capiPayload;

  // Asserções estritas do contrato de Purchase existente
  assert.equal(payload.event_name, "Purchase", "O nome do evento deve ser estritamente 'Purchase'");
  assert.equal(payload.event_id, "capi_pur_ord_caract_12345", "O event_id deve respeitar o padrão 'capi_pur_{order.id}'");
  assert.equal(typeof payload.event_time, "number", "event_time deve ser timestamp numérico em segundos");
  assert.equal(payload.custom_data.currency, "BRL", "Moeda deve ser BRL");
  assert.equal(payload.custom_data.value, 997, "Valor numérico deve ser 997.00");
  assert.equal(payload.custom_data.content_name, "Curso Avançado de Tráfego", "content_name deve bater");

  // user_data
  assert.deepEqual(payload.user_data.em, [identityService.sha256("aluno.infoproduto@teste.com")], "Hash SHA-256 do email deve ser idêntico");
  assert.deepEqual(payload.user_data.ph, [identityService.sha256("+5511998877665")], "Hash SHA-256 do telefone normalizado deve ser idêntico");
  assert.equal(payload.user_data.fbp, "fb.1.1710000000.123456789", "fbp deve ser repassado inalterado");
  assert.equal(payload.user_data.fbc, "fb.1.1710000000.IwAR0123456789", "fbc deve ser repassado inalterado");
  assert.equal(payload.user_data.client_ip_address, "201.80.10.25");
  assert.equal(payload.user_data.client_user_agent, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

  console.log("  ✔ Teste 1: Contrato de Purchase (identityService) validado com sucesso.");

  // -------------------------------------------------------------
  // Teste 2: Contrato de Carrinho Abandonado (InitiateCheckout / Timeline)
  // -------------------------------------------------------------
  const abandonParams = {
    clientId: "cli_bruna_ppp",
    customerName: "Lead Abandono Infoproduto",
    customerEmail: "lead.abandono@teste.com",
    customerPhone: "11999990001",
    productName: "Ebook Escala 10k",
    amountCents: BigInt(4700),
    platform: "HOTMART" as const,
    fbp: "fb.1.1710000000.987654321",
  };

  const abandonResult = identityService.processAbandonedCart(abandonParams);

  assert.equal(abandonResult.recoveryItem.productName, "Ebook Escala 10k");
  assert.equal(abandonResult.recoveryItem.type, "ABANDONED_CART");
  assert.equal(abandonResult.recoveryItem.platform, "HOTMART");
  assert.equal(abandonResult.recoveryItem.status, "PENDING");
  assert.equal(abandonResult.lead.email, "lead.abandono@teste.com");

  console.log("  ✔ Teste 2: Contrato de Abandono de Carrinho validado com sucesso.");

  // -------------------------------------------------------------
  // Teste 3: Normalizador Web CAPI de Produção (buildMetaUserData)
  // -------------------------------------------------------------
  const webUserData = buildMetaUserData({
    email: "cliente.web@dominio.com",
    phone: "11977778888",
    name: "Joao Silva",
    fbp: "fb.1.100.200",
    fbc: "fb.1.100.300",
    ipAddress: "177.10.20.30",
    userAgent: "Safari/537.36",
    externalId: "ext_999",
  });

  assert.deepEqual(webUserData.em, [sha256("cliente.web@dominio.com")]);
  assert.deepEqual(webUserData.ph, [sha256("+5511977778888".replace(/\D/g, ""))]);
  assert.deepEqual(webUserData.fn, [sha256("joao")]);
  assert.deepEqual(webUserData.ln, [sha256("silva")]);
  assert.equal(webUserData.fbp, "fb.1.100.200");
  assert.equal(webUserData.fbc, "fb.1.100.300");
  assert.equal(webUserData.client_ip_address, "177.10.20.30");
  assert.equal(webUserData.client_user_agent, "Safari/537.36");
  assert.deepEqual(webUserData.external_id, [sha256("ext_999")]);

  console.log("  ✔ Teste 3: Normalizador Web CAPI buildMetaUserData validado com sucesso.");
  console.log("✅ Todos os Testes de Caracterização passaram com 100% de integridade!\n");
}

runCharacterizationTests().catch((err) => {
  console.error("❌ Falha nos Testes de Caracterização:", err);
  process.exit(1);
});
