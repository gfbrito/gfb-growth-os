import { Request, Response } from "express";
import { mockDb } from "../../services/mockDb.js";

/**
 * Agency Owner / Gestor Macro Dashboard
 * Foco: Prioridade, Saúde das Contas, Tarefas ClickUp e Alertas
 */
export async function getAgencyDashboard(req: Request, res: Response): Promise<void> {
  const clients = mockDb.clients.map((c) => {
    const clientTasks = mockDb.tasks.filter((t) => t.clientId === c.id);
    const pendingTasks = clientTasks.filter((t) => t.status !== "DONE").length;
    const progressPct = Number((c.currentRevenueCents * BigInt(100)) / c.revenueGoalCents);

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      revenueGoal: Number(c.revenueGoalCents) / 100,
      currentRevenue: Number(c.currentRevenueCents) / 100,
      todayRevenue: Number(c.todayRevenueCents) / 100,
      progressPct,
      pendingTasks,
      healthStatus: progressPct >= 50 ? "HEALTHY" : "ATTENTION_NEEDED",
      assignedGestor: mockDb.users.find((u) => u.id === c.assignedGestorId)?.name || "Não atribuído",
    };
  });

  const totalRevenue = clients.reduce((acc, c) => acc + c.currentRevenue, 0);
  const totalTodayRevenue = clients.reduce((acc, c) => acc + c.todayRevenue, 0);
  const totalGoal = clients.reduce((acc, c) => acc + c.revenueGoal, 0);

  const tasksSummary = {
    total: mockDb.tasks.length,
    todo: mockDb.tasks.filter((t) => t.status === "TODO").length,
    inProgress: mockDb.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    review: mockDb.tasks.filter((t) => t.status === "REVIEW").length,
    done: mockDb.tasks.filter((t) => t.status === "DONE").length,
    urgent: mockDb.tasks.filter((t) => t.priority === "URGENT" && t.status !== "DONE").length,
  };

  const whatsappHealth = {
    connectedInstances: mockDb.whatsappInstances.filter((i) => i.status === "CONNECTED").length,
    totalInstances: mockDb.whatsappInstances.length,
    averageWarmingScore: Math.round(
      mockDb.whatsappInstances.reduce((acc, i) => acc + i.warmingScore, 0) /
        mockDb.whatsappInstances.length
    ),
    averageBanRisk: Math.round(
      mockDb.whatsappInstances.reduce((acc, i) => acc + i.banRiskScore, 0) /
        mockDb.whatsappInstances.length
    ),
  };

  res.json({
    organization: mockDb.organization,
    kpis: {
      totalRevenue,
      totalTodayRevenue,
      totalGoal,
      activeClientsCount: clients.length,
    },
    clients,
    tasksSummary,
    whatsappHealth,
    capiReadiness: {
      score: "9/9",
      status: "PROTECTED",
      emqAverage: 8.8,
      deduplicationRatePct: 99.98,
    },
  });
}

/**
 * Client Executive Dashboard
 * Foco: Certeza, Faturamento Real, Vendas e Meta do Mês
 */
export async function getClientDashboard(req: Request, res: Response): Promise<void> {
  const clientId = req.params.clientId || "cli_bruna_ppp";
  const client = mockDb.clients.find((c) => c.id === clientId || c.slug === clientId);

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const currentRevenue = Number(client.currentRevenueCents) / 100;
  const todayRevenue = Number(client.todayRevenueCents) / 100;
  const revenueGoal = Number(client.revenueGoalCents) / 100;
  const progressPct = Math.round((currentRevenue / revenueGoal) * 100);

  // Calculate required daily pace
  const daysInMonth = 30;
  const dayOfMonth = new Date().getDate() || 25;
  const remainingDays = Math.max(1, daysInMonth - dayOfMonth);
  const remainingAmount = Math.max(0, revenueGoal - currentRevenue);
  const requiredDailyPace = Math.round(remainingAmount / remainingDays);
  const currentDailyPace = Math.round(currentRevenue / dayOfMonth);
  const pacePercentage = Math.round((currentDailyPace / (revenueGoal / daysInMonth)) * 100);

  const clientOrders = mockDb.orders
    .filter((o) => o.clientId === client.id)
    .map((o) => ({
      ...o,
      grossAmount: Number(o.grossAmountCents) / 100,
    }));

  const clientLeads = mockDb.leads.filter((l) => l.clientId === client.id);
  const temperatureBreakdown = {
    hot: clientLeads.filter((l) => l.temperature === "HOT").length,
    warm: clientLeads.filter((l) => l.temperature === "WARM").length,
    cold: clientLeads.filter((l) => l.temperature === "COLD").length,
    total: clientLeads.length,
  };

  res.json({
    client: {
      id: client.id,
      name: client.name,
      slug: client.slug,
      pixelKey: client.pixelKey,
    },
    executiveSummary: {
      currentRevenue,
      todayRevenue,
      revenueGoal,
      progressPct,
      requiredDailyPace,
      currentDailyPace,
      pacePercentage,
      headline:
        pacePercentage >= 100
          ? `Operação em ritmo acelerado! Você está a ${pacePercentage}% da velocidade ideal para bater a meta.`
          : `Atenção ao ritmo: faltam R$ ${remainingAmount.toLocaleString("pt-BR")} para a meta.`,
    },
    temperatureBreakdown,
    recentSales: clientOrders.slice(0, 10),
  });
}
