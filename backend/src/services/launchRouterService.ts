/**
 * GFB Growth OS — Roteador Dinâmico de Lançamentos & Grupos VIP
 * Balanceamento de carga, auto-criação de grupos ao atingir 95% de capacidade,
 * registro de cliques UTM e enriquecimento do Identity Graph.
 */

import { mockDb, MockLaunchGroupItem } from "./mockDb.js";
import { identityService } from "./identityService.js";
import { logger } from "../utils/logger.js";

export interface RoutingResult {
  targetUrl: string;
  groupName: string;
  groupNumber: number;
  occupancyPct: number;
  isNewGroupCreated: boolean;
  leadId?: string;
}

class LaunchRouterService {
  /**
   * Roteamento Dinâmico Inteligente para /l/:slug
   */
  public routeVisitor(params: {
    slug: string;
    ipAddress?: string;
    userAgent?: string;
    utms?: Record<string, string>;
  }): RoutingResult | null {
    const launch = mockDb.launches.find((l) => l.slug === params.slug);
    if (!launch) return null;

    // Buscar grupos pertencentes ao lançamento
    let groups = mockDb.launchGroups.filter((g) => g.launchId === launch.id);

    // Encontrar grupo ativo que esteja recebendo e com vaga (< 95% de ocupação)
    let targetGroup = groups.find(
      (g) => g.status === "RECEIVING" && g.memberCount / g.maxMembers < 0.95
    );

    let isNewGroupCreated = false;

    // Se todos os grupos ativos estiverem >= 95% cheios, criar automaticamente o próximo grupo VIP
    if (!targetGroup) {
      const nextNumber = groups.length + 1;
      targetGroup = {
        id: `grp_auto_${Date.now()}`,
        launchId: launch.id,
        name: `Bruna Ortiz - Grupo VIP #${String(nextNumber).padStart(2, "0")}`,
        number: nextNumber,
        memberCount: 1, // apenas o bot admin
        maxMembers: 1024,
        status: "RECEIVING",
        inviteUrl: `https://chat.whatsapp.com/auto_invite_vip_${nextNumber}`,
      };

      // Inserir no banco de dados / mock store
      mockDb.launchGroups.push(targetGroup);
      launch.groupCount = nextNumber;
      isNewGroupCreated = true;

      logger.info(
        { launch: launch.slug, newGroup: targetGroup.name, number: nextNumber },
        "LaunchRouter: Auto-criação autônoma de novo Grupo VIP disparada (95% de lotação atingida)"
      );
    }

    // Registrar Lead ou Clique no Identity Graph
    const lead = identityService.resolveOrCreateLead({
      clientId: launch.clientId,
      ip: params.ipAddress,
      userAgent: params.userAgent,
      utms: params.utms,
      sourceTag: `Link Rotativo /l/${params.slug}`,
    });

    identityService.addTimelineEvent({
      leadId: lead.id,
      clientId: launch.clientId,
      type: "AD_CLICK",
      title: `Clique no Link VIP: /l/${params.slug}`,
      description: `Roteado para ${targetGroup.name} (${Math.round((targetGroup.memberCount / targetGroup.maxMembers) * 100)}% de ocupação).`,
      channel: "META_ADS",
      metadata: {
        slug: params.slug,
        targetGroup: targetGroup.name,
        utms: params.utms,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      targetUrl: targetGroup.inviteUrl,
      groupName: targetGroup.name,
      groupNumber: targetGroup.number,
      occupancyPct: Math.round((targetGroup.memberCount / targetGroup.maxMembers) * 100),
      isNewGroupCreated,
      leadId: lead.id,
    };
  }

  /**
   * Monitor de Entradas e Saídas via Webhook do WhatsApp (Evolution API)
   */
  public handleParticipantUpdate(params: {
    groupNumber: number;
    participantPhone: string;
    action: "add" | "remove";
  }) {
    const group = mockDb.launchGroups.find((g) => g.number === params.groupNumber);
    const lead = identityService.resolveOrCreateLead({
      clientId: "cli_bruna_ppp",
      phone: params.participantPhone,
      sourceTag: `Grupo VIP #${params.groupNumber}`,
    });

    if (params.action === "add") {
      lead.rfmPoints += 15;
      lead.temperature = lead.temperature === "COLD" ? "WARM" : lead.temperature;
      if (group && group.memberCount < group.maxMembers) {
        group.memberCount += 1;
      }

      identityService.addTimelineEvent({
        leadId: lead.id,
        clientId: "cli_bruna_ppp",
        type: "VIP_GROUP_JOIN",
        title: `Entrou no Grupo VIP #${params.groupNumber}`,
        description: `Lead ingressou no grupo. +15 pontos RFM adicionados.`,
        channel: "WPP_GRUPOS",
        timestamp: new Date().toISOString(),
      });
    } else if (params.action === "remove") {
      lead.rfmPoints = Math.max(0, lead.rfmPoints - 10);
      if (group && group.memberCount > 0) {
        group.memberCount -= 1;
      }

      identityService.addTimelineEvent({
        leadId: lead.id,
        clientId: "cli_bruna_ppp",
        type: "VIP_GROUP_LEAVE",
        title: `Saiu do Grupo VIP #${params.groupNumber}`,
        description: `Lead deixou o grupo. -10 pontos RFM descontados.`,
        channel: "WPP_GRUPOS",
        timestamp: new Date().toISOString(),
      });
    }

    return { lead, group };
  }
}

export const launchRouterService = new LaunchRouterService();
