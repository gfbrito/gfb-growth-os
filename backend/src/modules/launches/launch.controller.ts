import { Request, Response } from "express";
import { mockDb } from "../../services/mockDb.js";
import { launchRouterService } from "../../services/launchRouterService.js";
import { logger } from "../../utils/logger.js";

/**
 * Public Launch Redirect Endpoint (SendFlow style: /l/:slug)
 */
export async function handleLaunchRedirect(req: Request, res: Response): Promise<void> {
  const slug = String(req.params.slug);
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  const utms: Record<string, string> = {
    utm_source: String(req.query.utm_source || ""),
    utm_medium: String(req.query.utm_medium || ""),
    utm_campaign: String(req.query.utm_campaign || ""),
    utm_content: String(req.query.utm_content || ""),
    utm_term: String(req.query.utm_term || ""),
  };

  const routeResult = launchRouterService.routeVisitor({
    slug,
    ipAddress,
    userAgent,
    utms,
  });

  if (!routeResult) {
    res.status(404).send("<h1>Lançamento não encontrado ou encerrado.</h1>");
    return;
  }

  logger.info(
    { slug, targetGroup: routeResult.groupName, occupancy: `${routeResult.occupancyPct}%` },
    "Launch link resolved and redirected (/l/:slug)"
  );

  // Check if requested via API/JSON or Browser Redirect
  if (req.headers.accept?.includes("application/json")) {
    res.json({
      success: true,
      inviteUrl: routeResult.targetUrl,
      groupName: routeResult.groupName,
      groupNumber: routeResult.groupNumber,
      occupancyPct: routeResult.occupancyPct,
      isNewGroupCreated: routeResult.isNewGroupCreated,
      leadId: routeResult.leadId,
    });
    return;
  }

  // Render high-speed redirect page with Meta Pixel tracking
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Entrando no Grupo VIP...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #090d16;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #25D366;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Conectando ao grupo exclusivo...</h2>
  <p>Você está sendo direcionado para o <strong>${routeResult.groupName}</strong>.</p>
  <script>
    setTimeout(function() {
      window.location.href = "${routeResult.targetUrl}";
    }, 450);
  </script>
</body>
</html>`);
}

export async function listLaunches(req: Request, res: Response): Promise<void> {
  res.json({ launches: mockDb.launches });
}

export async function listLaunchGroups(req: Request, res: Response): Promise<void> {
  res.json({
    groups: mockDb.launchGroups,
    totalManagedGroups: mockDb.launchGroups.length,
    activeRetainedLeads: 4258,
    historicalTotalLeads: 4766,
    retentionRatePct: 89.3,
    totalClicks: 854,
  });
}

export async function toggleGroupStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;
  const grp = mockDb.launchGroups.find((g) => g.id === id);
  if (!grp) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }
  if (status) {
    grp.status = status;
  }
  res.json({ success: true, group: grp });
}

/**
 * Webhook para eventos de Entrada e Saída de participantes (Evolution API)
 */
export async function handleGroupParticipantWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { groupNumber, participantPhone, action } = req.body;
    if (!participantPhone || !action) {
      res.status(400).json({ error: "Campos obrigatórios ausentes" });
      return;
    }

    const result = launchRouterService.handleParticipantUpdate({
      groupNumber: Number(groupNumber) || 1,
      participantPhone,
      action: action as "add" | "remove",
    });

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

