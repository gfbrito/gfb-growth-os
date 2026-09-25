/**
 * GFB Growth OS — Webhooks de Pagamento & Recuperação em Tempo Real
 * Processa eventos oficiais da Kiwify, Hotmart, Eduzz e dispara o cruzamento
 * no Identity Graph, CAPI Server e fechamento de itens de recuperação.
 */

import { Request, Response } from "express";
import { identityService } from "../../services/identityService.js";
import { mockDb } from "../../services/mockDb.js";

export const handleKiwifyWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const status = payload.order_status || payload.event;
    const customer = payload.Customer || payload.customer || {};
    const product = payload.Product || payload.product || {};
    const tracking = payload.TrackingParameters || payload.tracking_parameters || {};
    const orderId = payload.order_id || payload.order_ref || `kiw_${Date.now()}`;
    const amountCents = BigInt(payload.Commissions?.charge_amount_cents || payload.order_amount || 99700);

    const utms = {
      utm_source: tracking.utm_source || "",
      utm_medium: tracking.utm_medium || "",
      utm_campaign: tracking.utm_campaign || "",
      utm_content: tracking.utm_content || "",
      utm_term: tracking.utm_term || "",
    };

    if (status === "paid" || status === "approved") {
      const result = identityService.processApprovedPurchase({
        clientId: "cli_bruna_ppp",
        customerName: customer.full_name || "Cliente Kiwify",
        customerEmail: customer.email || "",
        customerPhone: customer.mobile || "",
        customerCpf: customer.CPF || "",
        productName: product.product_name || "Produto Digital",
        amountCents,
        platform: "KIWIFY",
        externalOrderId: orderId,
        utms,
      });

      return res.status(200).json({
        success: true,
        event: "PURCHASE_PROCESSED",
        leadId: result.lead.id,
        orderId: result.order.id,
        recoveryClosed: !!result.closedRecoveryItem,
        capiSent: true,
      });
    }

    if (status === "cart_abandoned" || status === "abandoned_cart") {
      const result = identityService.processAbandonedCart({
        clientId: "cli_bruna_ppp",
        customerName: customer.full_name || "Lead Carrinho Kiwify",
        customerEmail: customer.email || "",
        customerPhone: customer.mobile || "",
        productName: product.product_name || "Produto Digital",
        amountCents,
        platform: "KIWIFY",
        utms,
      });

      return res.status(200).json({
        success: true,
        event: "CART_ABANDONED_RECORDED",
        leadId: result.lead.id,
        recoveryId: result.recoveryItem.id,
        deduplicated: result.isDuplicate,
      });
    }

    if (status === "waiting_payment") {
      const lead = identityService.resolveOrCreateLead({
        clientId: "cli_bruna_ppp",
        name: customer.full_name,
        email: customer.email,
        phone: customer.mobile,
        cpf: customer.CPF,
        utms,
      });

      identityService.addTimelineEvent({
        leadId: lead.id,
        clientId: "cli_bruna_ppp",
        type: "PIX_GENERATED",
        title: `Pix/Boleto Gerado: ${product.product_name || "Produto Digital"}`,
        description: `Aguardando liquidação de R$ ${(Number(amountCents) / 100).toFixed(2)}.`,
        channel: "KIWIFY",
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, event: "PENDING_PAYMENT_LOGGED" });
    }

    return res.status(200).json({ success: true, status: "IGNORED_OR_ACKNOWLEDGED" });
  } catch (error: any) {
    console.error("Erro no webhook Kiwify:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const handleHotmartWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const event = payload.event;
    const data = payload.data || {};
    const buyer = data.buyer || {};
    const product = data.product || {};
    const purchase = data.purchase || {};
    const amountCents = BigInt(Math.round((purchase.price?.value || 147.0) * 100));

    if (event === "PURCHASE_APPROVED") {
      const result = identityService.processApprovedPurchase({
        clientId: "cli_bruna_ppp",
        customerName: buyer.name || "Cliente Hotmart",
        customerEmail: buyer.email || "",
        customerPhone: buyer.checkout_phone || "",
        customerCpf: buyer.document || "",
        productName: product.name || "Curso Hotmart",
        amountCents,
        platform: "HOTMART",
        externalOrderId: purchase.transaction || `hot_${Date.now()}`,
      });

      return res.status(200).json({
        success: true,
        event: "PURCHASE_PROCESSED",
        leadId: result.lead.id,
        recoveryClosed: !!result.closedRecoveryItem,
      });
    }

    if (event === "PURCHASE_REFUNDED") {
      const lead = identityService.resolveOrCreateLead({
        clientId: "cli_bruna_ppp",
        name: buyer.name,
        email: buyer.email,
        phone: buyer.checkout_phone,
      });

      lead.temperature = "COLD";
      lead.rfmPoints = Math.max(0, lead.rfmPoints - 50);

      identityService.addTimelineEvent({
        leadId: lead.id,
        clientId: "cli_bruna_ppp",
        type: "ORDER_REFUNDED",
        title: `Reembolso Efetuado: ${product.name}`,
        description: `Transação ${purchase.transaction} reembolsada. Score RFM reduzido.`,
        channel: "HOTMART",
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, event: "REFUND_LOGGED" });
    }

    return res.status(200).json({ success: true, event: "ACK" });
  } catch (error: any) {
    console.error("Erro no webhook Hotmart:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const handleEduzzWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const status = payload.trans_status; // "3" = Pago
    const amountCents = BigInt(Math.round((parseFloat(payload.val_liquid || "97") || 97) * 100));

    if (status === "3" || status === 3) {
      const result = identityService.processApprovedPurchase({
        clientId: "cli_bruna_ppp",
        customerName: payload.cus_name || "Cliente Eduzz",
        customerEmail: payload.cus_email || "",
        customerPhone: payload.cus_cel || "",
        customerCpf: payload.cus_taxnumber || "",
        productName: payload.pro_name || "Produto Eduzz",
        amountCents,
        platform: "EDUZZ",
        externalOrderId: payload.trans_id || `edz_${Date.now()}`,
      });

      return res.status(200).json({
        success: true,
        event: "PURCHASE_PROCESSED",
        leadId: result.lead.id,
        recoveryClosed: !!result.closedRecoveryItem,
      });
    }

    return res.status(200).json({ success: true, event: "ACK" });
  } catch (error: any) {
    console.error("Erro no webhook Eduzz:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Endpoint de Simulação em 1 Clique para Teste da Agência/Cliente
 */
export const simulateWebhook = async (req: Request, res: Response) => {
  try {
    const {
      type = "PURCHASE",
      customerName = "Marcos Vinicius Teste",
      customerEmail = "marcos.teste@gmail.com",
      customerPhone = "+5511995544332",
      productName = "Programa Primeira Página (PPP)",
      amountCents = 99700,
      platform = "KIWIFY",
    } = req.body;

    if (type === "PURCHASE") {
      const result = identityService.processApprovedPurchase({
        clientId: "cli_bruna_ppp",
        customerName,
        customerEmail,
        customerPhone,
        productName,
        amountCents: BigInt(amountCents),
        platform: platform as any,
        externalOrderId: `sim_ord_${Date.now()}`,
        utms: {
          utm_source: "instagram",
          utm_medium: "stories",
          utm_campaign: "[CBO] Escala Simulada",
        },
      });

      return res.status(200).json({
        success: true,
        action: "COMPRA_SIMULADA_COM_SUCESSO",
        lead: {
          id: result.lead.id,
          name: result.lead.name,
          stage: result.lead.stage,
          temperature: result.lead.temperature,
          rfmPoints: result.lead.rfmPoints,
          totalSpent: Number(result.lead.totalSpentCents) / 100,
        },
        order: {
          id: result.order.id,
          product: result.order.productName,
          value: Number(result.order.grossAmountCents) / 100,
          platform: result.order.platform,
        },
        recoveryClosed: result.closedRecoveryItem
          ? {
              id: result.closedRecoveryItem.id,
              type: result.closedRecoveryItem.type,
              status: result.closedRecoveryItem.status,
            }
          : null,
        capiEvent: result.capiPayload,
      });
    }

    if (type === "CART_ABANDONED") {
      const result = identityService.processAbandonedCart({
        clientId: "cli_bruna_ppp",
        customerName,
        customerEmail,
        customerPhone,
        productName,
        amountCents: BigInt(amountCents),
        platform: platform as any,
        utms: {
          utm_source: "google_ads",
          utm_campaign: "Search_PPP",
        },
      });

      return res.status(200).json({
        success: true,
        action: "CARRINHO_ABANDONADO_SIMULADO",
        lead: result.lead,
        recoveryItem: result.recoveryItem,
        deduplicated: result.isDuplicate,
      });
    }

    return res.status(400).json({ success: false, message: "Tipo de simulação desconhecido" });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Retorna perfil 360° completo e Timeline de um Lead
 */
export const getLeadTimeline = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const profile = identityService.getLeadProfile(id);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Lead não encontrado" });
    }

    return res.status(200).json({
      success: true,
      lead: profile.lead,
      identifiers: profile.identifiers,
      timeline: profile.timeline,
      orders: profile.orders,
      recoveryItems: profile.recoveryItems,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
