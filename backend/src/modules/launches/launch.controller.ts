import { Request, Response } from "express";
import { mockDb } from "../../services/mockDb.js";
import { logger } from "../../utils/logger.js";

/**
 * Public Launch Redirect Endpoint (SendFlow style: /l/:slug)
 */
export async function handleLaunchRedirect(req: Request, res: Response): Promise<void> {
  const slug = String(req.params.slug);
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  const { utm_source, utm_medium, utm_campaign, utm_content, utm_term } = req.query;

  const launch = mockDb.launches.find((l) => l.slug === slug);

  if (!launch) {
    res.status(404).send("<h1>Lançamento não encontrado ou encerrado.</h1>");
    return;
  }

  logger.info({ slug, ipAddress, utm_source, utm_campaign }, "Launch link clicked (/l/:slug)");

  // Mock group invite link (in production: dynamic group from WhatsApp instance)
  const targetGroupInvite = "https://chat.whatsapp.com/sample_invite_group_gfb";

  // Check if requested via API/JSON or Browser Redirect
  if (req.headers.accept?.includes("application/json")) {
    res.json({
      launchName: launch.name,
      slug: launch.slug,
      inviteUrl: targetGroupInvite,
      currentMembers: launch.currentMembers,
      maxMembers: launch.maxMembers,
      isAccepting: launch.currentMembers < launch.maxMembers,
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
  <p>Você será redirecionado para o WhatsApp em instantes.</p>
  <script>
    setTimeout(function() {
      window.location.href = "${targetGroupInvite}";
    }, 600);
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
