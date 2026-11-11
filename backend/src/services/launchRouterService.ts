import { mockDb, MockLaunch, MockLaunchGroup, MockLaunchClick, MockLaunchParticipant } from "./mockDb.js";
import { logger } from "../utils/logger.js";

export type RouteResultType = "NOT_FOUND" | "PAUSED" | "REDIRECT";

export interface RouteLaunchResult {
  type: RouteResultType;
  launch?: MockLaunch;
  targetGroup?: MockLaunchGroup;
  targetUrl?: string;
  visitorId?: string;
  metaPixelId?: string | null;
  gtmContainerId?: string | null;
}

class LaunchRouterService {
  /**
   * Roteamento Dinâmico para /l/:slug (spec 12.7)
   */
  public routeVisitor(params: {
    slug: string;
    visitorId?: string;
    ipAddress?: string;
    userAgent?: string;
    utms?: Record<string, string>;
  }): RouteLaunchResult {
    const launch = mockDb.launches.find((l) => l.slug === params.slug);
    if (!launch) {
      return { type: "NOT_FOUND" };
    }

    // Regra 2: DRAFT, PAUSED ou CLOSED mostra aviso de inscrições pausadas sem registrar clique
    if (launch.status !== "ACTIVE") {
      return {
        type: "PAUSED",
        launch,
      };
    }

    // Regra 3 e 4: Escolha do grupo ativo
    const allGroups = mockDb.launchGroups.filter((g) => g.launchId === launch.id);
    const memberLimit = launch.memberLimitPerGroup || 1000;

    // Grupos com status = RECEIVING e abaixo do limite de membros
    const availableGroups = allGroups.filter(
      (g) => g.status === "RECEIVING" && g.memberCount < memberLimit
    );

    let targetGroup: MockLaunchGroup | undefined;

    if (availableGroups.length > 0) {
      if (launch.fillOrder === "SEQUENTIAL") {
        // SEQUENTIAL: o de menor position
        availableGroups.sort((a, b) => a.position - b.position);
        targetGroup = availableGroups[0];
      } else {
        // PROPORTIONAL: o de menor memberCount; empate, menor position
        availableGroups.sort((a, b) => {
          if (a.memberCount !== b.memberCount) {
            return a.memberCount - b.memberCount;
          }
          return a.position - b.position;
        });
        targetGroup = availableGroups[0];
      }
    } else {
      // Regra 5: Nenhum grupo com vaga
      if (launch.autoCreateEnabled) {
        // Põe um grupo na fila de criação se não houver um na fila
        const hasPending = mockDb.launchCreationQueue.some(
          (q) => q.launchId === launch.id && (q.status === "PENDING" || q.status === "CREATING")
        );
        if (!hasPending) {
          const nextNum = allGroups.length + 1;
          mockDb.launchCreationQueue.push({
            id: `que_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            launchId: launch.id,
            groupNumber: nextNum,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          });
          logger.info({ launchId: launch.id }, "Novo grupo adicionado à fila de criação automática.");
        }
      }

      // Redireciona para o grupo não pausado de menor memberCount
      const nonPaused = allGroups.filter((g) => g.status !== "PAUSED");
      if (nonPaused.length > 0) {
        nonPaused.sort((a, b) => a.memberCount - b.memberCount || a.position - b.position);
        targetGroup = nonPaused[0];
      } else {
        // Se não houver nenhum grupo não pausado, mostra página de aviso
        return {
          type: "PAUSED",
          launch,
        };
      }
    }

    // Regra 3: Registra o clique para ACTIVE
    const visitorId = params.visitorId || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newClick: MockLaunchClick = {
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      launchId: launch.id,
      visitorId,
      utmSource: params.utms?.utm_source || undefined,
      utmMedium: params.utms?.utm_medium || undefined,
      utmCampaign: params.utms?.utm_campaign || undefined,
      assignedGroupId: targetGroup?.id,
      createdAt: new Date().toISOString(),
    };
    mockDb.launchClicks.push(newClick);

    return {
      type: "REDIRECT",
      launch,
      targetGroup,
      targetUrl: targetGroup?.inviteUrl,
      visitorId,
      metaPixelId: launch.metaPixelId,
      gtmContainerId: launch.gtmContainerId,
    };
  }

  /**
   * Monitor de Entradas e Saídas de Grupos
   */
  public handleParticipantEvent(params: {
    launchId: string;
    groupId: string;
    participantPhone: string;
    action: "JOIN" | "LEAVE";
  }) {
    const { launchId, groupId, participantPhone, action } = params;
    const now = new Date().toISOString();

    let participant = mockDb.launchParticipants.find(
      (p) => p.launchId === launchId && p.phone === participantPhone
    );

    const group = mockDb.launchGroups.find((g) => g.id === groupId);

    if (action === "JOIN") {
      if (group) {
        group.memberCount += 1;
        if (group.memberCount >= group.maxMembers && group.status === "RECEIVING") {
          group.status = "FULL";
        }
      }

      if (participant) {
        if (!participant.groupIds.includes(groupId)) {
          participant.groupIds.push(groupId);
        }
        participant.status = "ACTIVE";
        participant.engagementScore += 15; // spec 13.3: Entrou no grupo +15
        if (participant.engagementScore >= 60) participant.classification = "HOT";
        else if (participant.engagementScore >= 30) participant.classification = "WARM";
        else participant.classification = "COOL";
      } else {
        // Enriquecimento com CRM se o lead já existir
        const crmLead = mockDb.leads.find((l) => l.phone === participantPhone);
        participant = {
          id: `prt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          launchId,
          phone: participantPhone,
          name: crmLead?.name || null,
          crmLeadId: crmLead?.id || null,
          groupIds: [groupId],
          status: "ACTIVE",
          engagementScore: 15,
          classification: "COOL",
          joinedAt: now,
          leftAt: null,
        };
        mockDb.launchParticipants.push(participant);
      }
    } else if (action === "LEAVE") {
      if (group && group.memberCount > 0) {
        group.memberCount -= 1;
        if (group.status === "FULL" && group.memberCount < group.maxMembers) {
          group.status = "RECEIVING";
        }
      }

      if (participant) {
        participant.groupIds = participant.groupIds.filter((gid) => gid !== groupId);
        if (participant.groupIds.length === 0) {
          participant.status = "LEFT";
          participant.leftAt = now;
          participant.engagementScore = 0; // spec 13.3: Saiu do grupo zera
          participant.classification = "COLD";
        }
      }
    }

    // Auto-criação automática pós-entrada (spec 13.2)
    const launch = mockDb.launches.find((l) => l.id === launchId);
    if (launch && launch.autoCreateEnabled && action === "JOIN") {
      const nonPaused = mockDb.launchGroups.filter((g) => g.launchId === launchId && g.status !== "PAUSED");
      const totalMembers = nonPaused.reduce((sum, g) => sum + g.memberCount, 0);
      const totalCapacity = nonPaused.reduce((sum, g) => sum + g.maxMembers, 0);

      if (totalCapacity > 0) {
        const occupancyPct = (totalMembers / totalCapacity) * 100;
        if (occupancyPct >= launch.autoCreateThresholdPercent) {
          const hasPending = mockDb.launchCreationQueue.some(
            (q) => q.launchId === launchId && (q.status === "PENDING" || q.status === "CREATING")
          );
          if (!hasPending) {
            mockDb.launchCreationQueue.push({
              id: `que_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              launchId,
              groupNumber: mockDb.launchGroups.filter((g) => g.launchId === launchId).length + 1,
              status: "PENDING",
              createdAt: now,
            });
          }
        }
      }
    }
  }
}

export const launchRouterService = new LaunchRouterService();
