/**
 * GFB Growth OS — Adaptador de Mensagens de WhatsApp & Captura de Origem
 * Extrai dados de anúncio Click-to-WhatsApp (CTWA) e resolve cliques do site via short code.
 */

import { mockDb, MockLead } from "../../services/mockDb.js";
import { LeadTrackingOrigin } from "./conversion.types.js";

export interface ExtractedReferralData {
  hasReferral: boolean;
  ctwaClid?: string;
  adId?: string;
  adTitle?: string;
  adBody?: string;
  sourceType?: string;
}

export interface WebsiteClickRecord {
  code: string;
  clientId: string;
  phoneDestination: string;
  fbp?: string;
  fbc?: string;
  fbclid?: string;
  campaignId?: string;
  adsetId?: string;
  adId?: string;
  ip?: string;
  userAgent?: string;
  utms: Record<string, string>;
  createdAt: string;
  matchedLeadId?: string;
}

/**
 * Adaptador de mensagens para múltiplos provedores (Evolution API, Cloud API, Baileys)
 */
export class WhatsAppMessageAdapter {
  /**
   * Extrai com segurança os dados de referral Click-to-WhatsApp
   * Se o provedor não entregar o dado, registra como ausente (não inventa).
   */
  public extractReferralData(payload: any): ExtractedReferralData {
    if (!payload || typeof payload !== "object") {
      return { hasReferral: false };
    }

    // Suporte a diferentes formatos (Evolution v2, Meta Cloud API, Baileys externalAdReply)
    const referral =
      payload.referral ||
      payload.message?.referral ||
      payload.data?.message?.referral ||
      payload.contextInfo?.externalAdReply ||
      payload.message?.extendedTextMessage?.contextInfo?.externalAdReply;

    if (!referral) {
      return { hasReferral: false };
    }

    const ctwaClid =
      referral.ctwa_clid ||
      referral.ctwaClid ||
      referral.click_id ||
      undefined;

    const adId =
      referral.source_id ||
      referral.sourceId ||
      referral.ad_id ||
      referral.adId ||
      undefined;

    const adTitle =
      referral.headline ||
      referral.title ||
      referral.source_url ||
      undefined;

    const adBody =
      referral.body ||
      referral.description ||
      undefined;

    const sourceType =
      referral.source_type ||
      referral.sourceType ||
      (referral.media_type ? "ad" : undefined);

    const hasAnyField = Boolean(ctwaClid || adId || adTitle || adBody);

    return {
      hasReferral: hasAnyField,
      ctwaClid: ctwaClid ? String(ctwaClid).trim() : undefined,
      adId: adId ? String(adId).trim() : undefined,
      adTitle: adTitle ? String(adTitle).trim() : undefined,
      adBody: adBody ? String(adBody).trim() : undefined,
      sourceType: sourceType ? String(sourceType).trim() : undefined,
    };
  }

  /**
   * Extrai o código curto de match no texto da mensagem pré-preenchida
   * Padrão: [REF-XXXX] ou #REF-XXXX ou REF-XXXX
   */
  public extractShortTrackingCode(messageText: string): string | null {
    if (!messageText) return null;
    const match = messageText.match(/(?:REF-|#REF-|COD-)([A-Z0-9]{4,10})/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    return null;
  }
}

export const whatsAppMessageAdapter = new WhatsAppMessageAdapter();

/**
 * Gerenciador de cliques de redirecionamento do site para o WhatsApp
 */
export class WebsiteClickTrackerService {
  /**
   * Gera um short code de 6 caracteres hexadecimais/alfanuméricos
   */
  private generateShortCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Registra clique na landing page e gera o link de redirecionamento com código curto
   */
  public registerClick(params: {
    clientId: string;
    phoneDestination: string;
    baseMessage?: string;
    fbp?: string;
    fbc?: string;
    fbclid?: string;
    campaignId?: string;
    adsetId?: string;
    adId?: string;
    ip?: string;
    userAgent?: string;
    utms?: Record<string, string>;
  }): { code: string; redirectUrl: string } {
    const code = this.generateShortCode();
    const cleanPhone = params.phoneDestination.replace(/\D/g, "");

    const record: WebsiteClickRecord = {
      code,
      clientId: params.clientId,
      phoneDestination: cleanPhone,
      fbp: params.fbp,
      fbc: params.fbc,
      fbclid: params.fbclid,
      campaignId: params.campaignId,
      adsetId: params.adsetId,
      adId: params.adId,
      ip: params.ip,
      userAgent: params.userAgent,
      utms: params.utms || {},
      createdAt: new Date().toISOString(),
    };

    mockDb.websiteClickIntents.set(code, record);

    const baseMsg = params.baseMessage || "Olá! Gostaria de mais informações sobre os serviços.";
    const fullText = `${baseMsg} [REF-${code}]`;
    const redirectUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`;

    return { code, redirectUrl };
  }

  /**
   * Procura o registro de clique pelo short code
   */
  public findAndMatchClick(code: string, leadId?: string): WebsiteClickRecord | null {
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const record = mockDb.websiteClickIntents.get(cleanCode);
    if (!record) return null;

    if (leadId && !record.matchedLeadId) {
      record.matchedLeadId = leadId;
    }

    return record;
  }
}

export const websiteClickTrackerService = new WebsiteClickTrackerService();

/**
 * Serviço de resolução e fixação da origem do Lead
 */
export class LeadOriginCaptureService {
  /**
   * Atribui e congela a origem do lead na primeira mensagem recebida.
   * Regra estrita: Não sobrescreve se o lead já tiver origem definida.
   * Campos de campanha NUNCA recebem nome de evento ou de etapa.
   */
  public captureAndLockOrigin(
    lead: MockLead,
    inboundPayload: {
      messageText?: string;
      rawWebhook?: any;
    }
  ): LeadTrackingOrigin {
    // Se o lead já possui origem gravada (não vazia e não sobrescreve)
    if (lead.originType && (lead.ctwaClid || lead.clickTrackingCode || lead.originType === "UNTRACKED")) {
      return {
        originType: lead.originType,
        ctwaClid: lead.ctwaClid,
        adId: lead.adId,
        adTitle: lead.adTitle,
        adBody: lead.adBody,
        fbc: lead.fbc,
        fbp: lead.fbp,
        trackingCode: lead.clickTrackingCode,
      };
    }

    const referral = whatsAppMessageAdapter.extractReferralData(inboundPayload.rawWebhook);

    // 1. Origem: Anúncio Click-to-WhatsApp
    if (referral.hasReferral && referral.ctwaClid) {
      lead.originType = "CLICK_TO_WHATSAPP";
      lead.ctwaClid = referral.ctwaClid;
      lead.adId = referral.adId;
      lead.adTitle = referral.adTitle;
      lead.adBody = referral.adBody;
      lead.attributionSource = "Meta Click-to-WhatsApp";
      return {
        originType: "CLICK_TO_WHATSAPP",
        ctwaClid: referral.ctwaClid,
        adId: referral.adId,
        adTitle: referral.adTitle,
        adBody: referral.adBody,
      };
    }

    // 2. Origem: Clique no Site com casamento por short code (sem janela de tempo)
    const shortCode = whatsAppMessageAdapter.extractShortTrackingCode(inboundPayload.messageText || "");
    if (shortCode) {
      const click = websiteClickTrackerService.findAndMatchClick(shortCode, lead.id);
      if (click) {
        lead.originType = "WEBSITE_CLICK";
        lead.clickTrackingCode = shortCode;
        lead.fbc = click.fbc;
        lead.fbp = click.fbp;
        lead.adId = click.adId;
        lead.utmSource = click.utms.utm_source;
        lead.utmMedium = click.utms.utm_medium;
        lead.utmCampaign = click.utms.utm_campaign; // Nunca nome de etapa/evento
        lead.utmContent = click.utms.utm_content;
        lead.utmTerm = click.utms.utm_term;
        lead.attributionSource = "Website WhatsApp Click Redirect";

        return {
          originType: "WEBSITE_CLICK",
          trackingCode: shortCode,
          fbc: click.fbc,
          fbp: click.fbp,
          adId: click.adId,
          campaignId: click.campaignId,
          adsetId: click.adsetId,
          ip: click.ip,
          userAgent: click.userAgent,
          utms: click.utms,
        };
      }
    }

    // 3. Origem: Sem identificador
    lead.originType = "UNTRACKED";
    lead.attributionSource = "Sem identificador";

    return {
      originType: "UNTRACKED",
    };
  }
}

export const leadOriginCaptureService = new LeadOriginCaptureService();
