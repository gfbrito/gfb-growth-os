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

  // 7.4 Projeção Preditiva de Faturamento com IA (Run-rate e curva de GMV)
  const expectedClosingRevenue = Math.round(currentRevenue + (currentDailyPace * 1.12 * remainingDays));
  const confidenceBandMin = Math.round(expectedClosingRevenue * 0.92);
  const confidenceBandMax = Math.round(expectedClosingRevenue * 1.18);

  const predictiveForecast = {
    expectedClosingRevenue,
    confidenceBandMin,
    confidenceBandMax,
    confidenceScorePct: 92,
    runRateHourlyVelocity: Math.round((todayRevenue / 14) * 100) / 100,
    launchDayProgress: "Dia 4 de 7 (Carrinho Aberto)",
    projectedDeltaGoal: expectedClosingRevenue - revenueGoal,
    isGoalAchievedProjected: expectedClosingRevenue >= revenueGoal,
    aiRecommendation:
      expectedClosingRevenue >= revenueGoal
        ? `🔥 Projeção indica superação da meta em +${Math.round(((expectedClosingRevenue - revenueGoal) / revenueGoal) * 100)}% (R$ ${expectedClosingRevenue.toLocaleString("pt-BR")}). Intensifique o remarketing no WhatsApp no último dia de carrinho para maximizar o ticket médio.`
        : `⚠️ Ritmo abaixo da meta. Recomendamos aumentar o orçamento nos conjuntos de lookalike de compradores e ativar a régua de recuperação de PIX pendente para recuperar ~R$ 18.000.`,
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
    predictiveForecast,
    temperatureBreakdown,
    recentSales: clientOrders.slice(0, 10),
  });
}

/**
 * 7.5 Exportação de Relatórios Executivos em PDF/Excel/CSV
 */
export async function exportExecutiveReport(req: Request, res: Response): Promise<void> {
  const clientId = (req.query.clientId as string) || "cli_bruna_ppp";
  const format = (req.params.format || req.query.format || "csv") as string;
  const client = mockDb.clients.find((c) => c.id === clientId) || mockDb.clients[0];

  const clientOrders = mockDb.orders.filter((o) => o.clientId === client.id);
  const totalRevenue = Number(client.currentRevenueCents) / 100;
  const goal = Number(client.revenueGoalCents) / 100;

  if (format === "csv" || format === "excel") {
    let csvContent = `RELATÓRIO EXECUTIVO DE FECHAMENTO — GFB GROWTH OS\n`;
    csvContent += `Cliente:;${client.name}\n`;
    csvContent += `Data de Emissão:;${new Date().toLocaleDateString("pt-BR")}\n`;
    csvContent += `Faturamento Total:;R$ ${totalRevenue.toLocaleString("pt-BR")}\n`;
    csvContent += `Meta do Lançamento:;R$ ${goal.toLocaleString("pt-BR")}\n`;
    csvContent += `Atingimento:;${Math.round((totalRevenue / goal) * 100)}%\n\n`;

    csvContent += `ID Transação;Cliente;E-mail;Produto;Valor Bruto (R$);Status;Plataforma;Data\n`;
    for (const o of clientOrders) {
      csvContent += `${o.id};"${o.leadName}";${o.leadEmail};"${o.productName}";${(Number(o.grossAmountCents) / 100).toFixed(2)};${o.status};${o.platform};${o.createdAt}\n`;
    }

    const filename = `relatorio_executivo_${client.slug}_${Date.now()}.${format === "excel" ? "xls" : "csv"}`;
    res.setHeader("Content-Type", format === "excel" ? "application/vnd.ms-excel; charset=utf-8" : "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvContent);
    return;
  }

  // Formato PDF (HTML formatado para impressão instantânea em PDF)
  const htmlReport = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Relatório Executivo — ${client.name}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
      .header { border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
      .title { font-size: 24px; font-weight: bold; color: #0f172a; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
      .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
      .kpi-val { font-size: 22px; font-weight: bold; color: #059669; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
      th { background: #f1f5f9; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">GFB Growth OS — Relatório Executivo</div>
        <div>Cliente: <strong>${client.name}</strong> • Campanha: <strong>Lançamento MTC 2026</strong></div>
      </div>
      <div>Data: ${new Date().toLocaleDateString("pt-BR")}</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div>Faturamento Total</div>
        <div class="kpi-val">R$ ${totalRevenue.toLocaleString("pt-BR")}</div>
      </div>
      <div class="kpi-card">
        <div>Meta Estipulada</div>
        <div class="kpi-val">R$ ${goal.toLocaleString("pt-BR")}</div>
      </div>
      <div class="kpi-card">
        <div>Progresso da Meta</div>
        <div class="kpi-val">${Math.round((totalRevenue / goal) * 100)}%</div>
      </div>
      <div class="kpi-card">
        <div>Total de Vendas</div>
        <div class="kpi-val">${clientOrders.length}</div>
      </div>
    </div>

    <h3>Extrato Consolidado das Transações</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>E-mail</th>
          <th>Produto</th>
          <th>Valor</th>
          <th>Status</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${clientOrders
          .slice(0, 25)
          .map(
            (o) => `
          <tr>
            <td>${o.id}</td>
            <td>${o.leadName}</td>
            <td>${o.leadEmail}</td>
            <td>${o.productName}</td>
            <td>R$ ${(Number(o.grossAmountCents) / 100).toFixed(2)}</td>
            <td>${o.status}</td>
            <td>${o.createdAt.slice(0, 10)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <script>window.onload = function() { window.print(); }</script>
  </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(htmlReport);
}

