import { Request, Response } from "express";
import {
  mockDb,
  MockLaunch,
  MockLaunchGroup,
  MockLaunchClick,
  MockLaunchParticipant,
  MockLaunchQueueItem,
  MockLaunchMessage,
  MockLaunchScheduledGroupAction,
  MockLaunchInboxMessage,
  MockLaunchWebhook,
  MockLaunchWebhookDelivery,
} from "../../services/mockDb.js";
import { launchRouterService } from "../../services/launchRouterService.js";
import { logger } from "../../utils/logger.js";

// Helper: Gera slug amigável e único
function generateUniqueSlug(name: string, excludeId?: string): string {
  const baseSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "lancamento";

  let slug = baseSlug;
  let counter = 1;

  while (mockDb.launches.some((l) => l.slug === slug && l.id !== excludeId)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

// ----------------------------------------------------------------------
// 1. REDIRECIONADOR PÚBLICO (/l/:slug)
// ----------------------------------------------------------------------
export async function handleLaunchRedirect(req: Request, res: Response): Promise<void> {
  const slug = String(req.params.slug);
  const visitorId = (req.cookies && req.cookies.growth_visitor_id) || (req.headers["x-visitor-id"] as string);
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
    visitorId,
    ipAddress,
    userAgent,
    utms,
  });

  if (routeResult.type === "NOT_FOUND") {
    res.status(404).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Link não encontrado</title><style>body{background:#090d16;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}</style></head>
<body><div><h1>404 — Link não encontrado</h1><p>O link solicitado não existe ou foi removido.</p></div></body></html>`);
    return;
  }

  if (routeResult.type === "PAUSED") {
    const launch = routeResult.launch;
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${launch?.name || "Lançamento"} — Inscrições Pausadas</title>
  <style>
    body { background: #090d16; color: #fff; font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; max-width: 450px; }
    h1 { font-size: 1.4rem; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    ${launch?.logoUrl ? `<img src="${launch.logoUrl}" alt="" style="width:72px;height:72px;border-radius:12px;margin-bottom:16px;" />` : ""}
    <h1>${launch?.name || "Lançamento"}</h1>
    <p>As inscrições estão pausadas no momento.</p>
  </div>
</body>
</html>`);
    return;
  }

  // REDIRECT ativo
  if (routeResult.visitorId) {
    res.cookie("growth_visitor_id", routeResult.visitorId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      httpOnly: true,
      sameSite: "lax",
    });
  }

  if (req.headers.accept?.includes("application/json")) {
    res.json({
      success: true,
      inviteUrl: routeResult.targetUrl,
      groupName: routeResult.targetGroup?.name,
      visitorId: routeResult.visitorId,
    });
    return;
  }

  // Página intermediária rápida com rastreamento Pixel / GTM
  const pixelSnippet = routeResult.metaPixelId
    ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${routeResult.metaPixelId}');fbq('track', 'PageView');fbq('track', 'Lead');`
    : "";

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Entrando no Grupo VIP...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${pixelSnippet ? `<script>${pixelSnippet}</script>` : ""}
  <style>
    body { background: #090d16; color: #fff; font-family: system-ui; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #25D366; border-radius: 50%; animation: spin 0.7s linear infinite; margin-bottom: 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Conectando ao grupo exclusivo...</h2>
  <p>Você está sendo direcionado para o <strong>${routeResult.targetGroup?.name || "Grupo VIP"}</strong>.</p>
  <script>
    setTimeout(function() {
      window.location.href = "${routeResult.targetUrl}";
    }, 350);
  </script>
</body>
</html>`);
}

// ----------------------------------------------------------------------
// 2. CRUD DE LANÇAMENTOS
// ----------------------------------------------------------------------
export async function listLaunches(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const queryClientId = req.query.clientId as string;

  let launches = [...mockDb.launches];

  if (user?.growthRole === "CLIENT_OWNER" || user?.growthRole === "CLIENT_ATTENDANT") {
    // RBAC: Clientes só veem os seus próprios lançamentos (B6.1)
    launches = launches.filter((l) => l.clientId === user.clientId);
  } else if (queryClientId) {
    launches = launches.filter((l) => l.clientId === queryClientId);
  }

  // Enriquecer dados dos grupos
  const enriched = launches.map((l) => {
    const groups = mockDb.launchGroups.filter((g) => g.launchId === l.id);
    const totalMembers = groups.reduce((acc, g) => acc + g.memberCount, 0);
    const maxCapacity = groups.reduce((acc, g) => acc + g.maxMembers, 0);
    const clicks = mockDb.launchClicks.filter((c) => c.launchId === l.id).length;
    const participants = mockDb.launchParticipants.filter((p) => p.launchId === l.id).length;
    const conversion = clicks > 0 ? Number(((participants / clicks) * 100).toFixed(1)) : 0;

    return {
      ...l,
      currentMembers: totalMembers,
      maxMembers: maxCapacity,
      groupCount: groups.length,
      totalLeads: participants,
      conversionRatePct: conversion,
    };
  });

  res.json({ launches: enriched });
}

export async function createLaunch(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const {
    name,
    clientId,
    logoUrl,
    description,
    instanceKey,
    memberLimitPerGroup,
    autoCreateEnabled,
    autoCreateThresholdPercent,
    fillOrder,
    groupNamePattern,
    groupDescription,
    initialGroupCount = 1,
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: "Nome do lançamento é obrigatório" });
    return;
  }

  const effectiveClientId =
    user?.growthRole === "CLIENT_OWNER" ? user.clientId : clientId || "cli_bruna_ppp";

  // Gera slug único (B6.3)
  const slug = generateUniqueSlug(name.trim());
  const now = new Date().toISOString();
  const launchId = `lnc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newLaunch: MockLaunch = {
    id: launchId,
    clientId: effectiveClientId,
    name: name.trim(),
    slug,
    status: "DRAFT",
    logoUrl: logoUrl || null,
    description: description || "",
    instanceKey: instanceKey || "aqc_bruna_01",
    memberLimitPerGroup: Number(memberLimitPerGroup) || 1000,
    autoCreateEnabled: Boolean(autoCreateEnabled),
    autoCreateThresholdPercent: Number(autoCreateThresholdPercent) || 90,
    fillOrder: fillOrder === "SEQUENTIAL" ? "SEQUENTIAL" : "PROPORTIONAL",
    groupNamePattern: groupNamePattern || "{nome} - Grupo {n}",
    groupDescription: groupDescription || "",
    metaPixelId: null,
    gtmContainerId: null,
    aiEnabled: false,
    aiSystemPrompt: "",
    aiAutoReply: false,
    currentMembers: 0,
    maxMembers: (Number(memberLimitPerGroup) || 1000) * (Number(initialGroupCount) || 1),
    groupCount: Number(initialGroupCount) || 1,
    totalLeads: 0,
    conversionRatePct: 0,
    createdAt: now,
    updatedAt: now,
  };

  mockDb.launches.push(newLaunch);

  // Criar grupos iniciais na fila e no mockDb
  const countToCreate = Math.max(1, Number(initialGroupCount) || 1);
  for (let i = 1; i <= countToCreate; i++) {
    const formattedName = (newLaunch.groupNamePattern || "{nome} - Grupo {n}")
      .replace("{nome}", newLaunch.name)
      .replace("{n}", String(i));

    const newGroup: MockLaunchGroup = {
      id: `grp_${Date.now()}_${i}`,
      launchId: newLaunch.id,
      name: formattedName,
      number: i,
      memberCount: 0,
      maxMembers: newLaunch.memberLimitPerGroup,
      status: "RECEIVING",
      inviteUrl: `https://chat.whatsapp.com/invite_${newLaunch.slug}_${i}`,
      whatsappGroupId: `1203630${Date.now().toString().slice(-4)}${i}@g.us`,
      position: i,
      createdAt: now,
    };
    mockDb.launchGroups.push(newGroup);
  }

  res.status(201).json({ success: true, launch: newLaunch });
}

export async function getLaunchById(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);

  const launch = mockDb.launches.find((l) => l.id === id);
  if (!launch) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER" && launch.clientId !== user.clientId) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  const groups = mockDb.launchGroups.filter((g) => g.launchId === launch.id);
  const totalMembers = groups.reduce((acc, g) => acc + g.memberCount, 0);
  const maxCapacity = groups.reduce((acc, g) => acc + g.maxMembers, 0);
  const clicks = mockDb.launchClicks.filter((c) => c.launchId === launch.id).length;
  const participants = mockDb.launchParticipants.filter((p) => p.launchId === launch.id).length;
  const conversion = clicks > 0 ? Number(((participants / clicks) * 100).toFixed(1)) : 0;

  res.json({
    launch: {
      ...launch,
      currentMembers: totalMembers,
      maxMembers: maxCapacity,
      groupCount: groups.length,
      totalLeads: participants,
      conversionRatePct: conversion,
    },
    groups,
  });
}

export async function updateLaunch(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);

  const launch = mockDb.launches.find((l) => l.id === id);
  if (!launch) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER" && launch.clientId !== user.clientId) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  const {
    name,
    slug,
    status,
    logoUrl,
    description,
    instanceKey,
    memberLimitPerGroup,
    autoCreateEnabled,
    autoCreateThresholdPercent,
    fillOrder,
    groupNamePattern,
    groupDescription,
    metaPixelId,
    gtmContainerId,
    aiEnabled,
    aiSystemPrompt,
    aiAutoReply,
  } = req.body;

  if (name !== undefined) launch.name = name.trim();
  if (slug !== undefined && slug.trim()) {
    launch.slug = generateUniqueSlug(slug.trim(), launch.id);
  }
  if (status !== undefined) launch.status = status;
  if (logoUrl !== undefined) launch.logoUrl = logoUrl;
  if (description !== undefined) launch.description = description;
  if (instanceKey !== undefined) launch.instanceKey = instanceKey;
  if (memberLimitPerGroup !== undefined) launch.memberLimitPerGroup = Number(memberLimitPerGroup);
  if (autoCreateEnabled !== undefined) launch.autoCreateEnabled = Boolean(autoCreateEnabled);
  if (autoCreateThresholdPercent !== undefined) launch.autoCreateThresholdPercent = Number(autoCreateThresholdPercent);
  if (fillOrder !== undefined) launch.fillOrder = fillOrder;
  if (groupNamePattern !== undefined) launch.groupNamePattern = groupNamePattern;
  if (groupDescription !== undefined) launch.groupDescription = groupDescription;
  if (metaPixelId !== undefined) launch.metaPixelId = metaPixelId;
  if (gtmContainerId !== undefined) launch.gtmContainerId = gtmContainerId;
  if (aiEnabled !== undefined) launch.aiEnabled = Boolean(aiEnabled);
  if (aiSystemPrompt !== undefined) launch.aiSystemPrompt = aiSystemPrompt;
  if (aiAutoReply !== undefined) launch.aiAutoReply = Boolean(aiAutoReply);

  launch.updatedAt = new Date().toISOString();

  res.json({ success: true, launch });
}

export async function deleteLaunch(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);
  const confirmationName = String(req.body?.confirmationName || req.query?.confirmationName || "");

  const launchIndex = mockDb.launches.findIndex((l) => l.id === id);
  if (launchIndex === -1) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  const launch = mockDb.launches[launchIndex];
  if (user?.growthRole === "CLIENT_OWNER" && launch.clientId !== user.clientId) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  // Critério B6.7: Excluir exige digitar o nome exato
  if (!confirmationName || confirmationName.trim() !== launch.name.trim()) {
    res.status(400).json({ error: "O nome de confirmação não confere com o nome do lançamento." });
    return;
  }

  // Remove lançamento e seus registros internos do Growth OS (não apaga grupos no WhatsApp)
  mockDb.launches.splice(launchIndex, 1);
  mockDb.launchGroups = mockDb.launchGroups.filter((g) => g.launchId !== id);
  mockDb.launchParticipants = mockDb.launchParticipants.filter((p) => p.launchId !== id);
  mockDb.launchClicks = mockDb.launchClicks.filter((c) => c.launchId !== id);

  res.json({ success: true, message: "Lançamento excluído com sucesso." });
}

// ----------------------------------------------------------------------
// 3. DASHBOARD DO LANÇAMENTO (spec 12.5 & 15.1)
// ----------------------------------------------------------------------
export async function getLaunchDashboard(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const launch = mockDb.launches.find((l) => l.id === id);
  if (!launch) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  const groups = mockDb.launchGroups.filter((g) => g.launchId === id);
  const participants = mockDb.launchParticipants.filter((p) => p.launchId === id);
  const clicks = mockDb.launchClicks.filter((c) => c.launchId === id);

  const totalCapacity = groups.reduce((acc, g) => acc + g.maxMembers, 0);
  const totalOccupied = groups.reduce((acc, g) => acc + g.memberCount, 0);
  const totalOccupiedPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const totalEntries = participants.length;
  const activeLeads = participants.filter((p) => p.status === "ACTIVE").length;
  const totalExits = participants.filter((p) => p.status === "LEFT").length;

  const totalClicksCount = clicks.length;
  const conversionRate = totalClicksCount > 0 ? Number(((totalEntries / totalClicksCount) * 100).toFixed(1)) : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayClicks = clicks.filter((c) => c.createdAt.startsWith(todayStr)).length;
  const todayEntries = participants.filter((p) => p.joinedAt.startsWith(todayStr)).length;
  const todayExits = participants.filter((p) => p.leftAt && p.leftAt.startsWith(todayStr)).length;

  // Séries diárias dos últimos 14 dias
  const entriesPerDay: Array<{ date: string; count: number }> = [];
  const entryRatePerDay: Array<{ date: string; rate: number }> = [];
  const exitRatePerDay: Array<{ date: string; rate: number }> = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

    const dayEntries = participants.filter((p) => p.joinedAt.startsWith(dateStr)).length;
    const dayClicks = clicks.filter((c) => c.createdAt.startsWith(dateStr)).length;
    const dayExits = participants.filter((p) => p.leftAt && p.leftAt.startsWith(dateStr)).length;

    entriesPerDay.push({ date: label, count: dayEntries });
    entryRatePerDay.push({ date: label, rate: dayClicks > 0 ? Number(((dayEntries / dayClicks) * 100).toFixed(1)) : 0 });
    exitRatePerDay.push({ date: label, rate: activeLeads > 0 ? Number(((dayExits / activeLeads) * 100).toFixed(1)) : 0 });
  }

  const queueItems = mockDb.launchCreationQueue.filter((q) => q.launchId === id && q.status === "PENDING");

  res.json({
    totalLeads: totalEntries,
    activeLeads,
    totalClicks: totalClicksCount,
    todayClicks,
    totalEntries,
    todayEntries,
    todayExits,
    conversionRatePct: conversionRate,
    entriesPerDay,
    entryRatePerDay,
    exitRatePerDay,
    totalCapacity,
    totalOccupied,
    totalOccupiedPct,
    creationQueueCount: queueItems.length,
    publicLink: `http://localhost:3000/l/${launch.slug}`,
    recentActivity: {
      entries7d: participants.length,
      clicks7d: clicks.length,
    },
  });
}

// ----------------------------------------------------------------------
// 4. GRUPOS (spec 13.1 & 13.2)
// ----------------------------------------------------------------------
export async function listGroups(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const groups = mockDb.launchGroups
    .filter((g) => g.launchId === id)
    .sort((a, b) => a.position - b.position);
  res.json({ groups });
}

export async function enqueueGroups(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const launch = mockDb.launches.find((l) => l.id === id);
  if (!launch) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  const count = Math.max(1, Number(req.body.count) || 1);
  const existingGroups = mockDb.launchGroups.filter((g) => g.launchId === id);
  const created: MockLaunchGroup[] = [];

  for (let i = 1; i <= count; i++) {
    const nextNumber = existingGroups.length + i;
    const formattedName = (launch.groupNamePattern || "{nome} - Grupo {n}")
      .replace("{nome}", launch.name)
      .replace("{n}", String(nextNumber));

    const newGroup: MockLaunchGroup = {
      id: `grp_${Date.now()}_${nextNumber}`,
      launchId: id,
      name: formattedName,
      number: nextNumber,
      memberCount: 0,
      maxMembers: launch.memberLimitPerGroup,
      status: "RECEIVING",
      inviteUrl: `https://chat.whatsapp.com/invite_${launch.slug}_${nextNumber}`,
      whatsappGroupId: `1203630${Date.now().toString().slice(-4)}${nextNumber}@g.us`,
      position: nextNumber,
      createdAt: new Date().toISOString(),
    };
    mockDb.launchGroups.push(newGroup);
    created.push(newGroup);
  }

  res.json({ success: true, groups: created, countCreated: created.length });
}

export async function linkExistingGroup(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { whatsappGroupId, name, inviteUrl } = req.body;

  const existingGroups = mockDb.launchGroups.filter((g) => g.launchId === id);
  const nextNumber = existingGroups.length + 1;

  const newGroup: MockLaunchGroup = {
    id: `grp_link_${Date.now()}`,
    launchId: id,
    name: name || `Grupo Vinculado ${nextNumber}`,
    number: nextNumber,
    memberCount: 0,
    maxMembers: 1000,
    status: "RECEIVING",
    inviteUrl: inviteUrl || `https://chat.whatsapp.com/linked_${nextNumber}`,
    whatsappGroupId: whatsappGroupId || `1203630_linked_${nextNumber}@g.us`,
    position: nextNumber,
    createdAt: new Date().toISOString(),
  };

  mockDb.launchGroups.push(newGroup);
  res.json({ success: true, group: newGroup });
}

export async function getLinkableGroups(req: Request, res: Response): Promise<void> {
  const linkable = [
    { whatsappGroupId: "120363011111@g.us", name: "Grupo Geral de Avisos", memberCount: 140 },
    { whatsappGroupId: "120363022222@g.us", name: "Comunidade Alunos Antigos", memberCount: 320 },
  ];
  res.json({ groups: linkable });
}

export async function syncGroups(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const groups = mockDb.launchGroups.filter((g) => g.launchId === id);
  // Atualiza status se lotado
  groups.forEach((g) => {
    if (g.memberCount >= g.maxMembers && g.status === "RECEIVING") {
      g.status = "FULL";
    }
  });
  res.json({ success: true, syncedCount: groups.length, groups });
}

export async function updateGroup(req: Request, res: Response): Promise<void> {
  const { id, groupId } = req.params;
  const group = mockDb.launchGroups.find((g) => g.launchId === id && g.id === groupId);
  if (!group) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }

  const { name, status, position } = req.body;
  if (name !== undefined) group.name = name.trim();
  if (status !== undefined) group.status = status;
  if (position !== undefined) group.position = Number(position);

  res.json({ success: true, group });
}

export async function removeGroup(req: Request, res: Response): Promise<void> {
  const { id, groupId } = req.params;
  const idx = mockDb.launchGroups.findIndex((g) => g.launchId === id && g.id === groupId);
  if (idx === -1) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }

  mockDb.launchGroups.splice(idx, 1);
  res.json({ success: true, message: "Grupo desvinculado do lançamento (permanece no WhatsApp)." });
}

export async function getGroupParticipants(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const groupId = String(req.params.groupId);
  const participants = mockDb.launchParticipants.filter((p) => p.launchId === id && p.groupIds.includes(groupId));
  res.json({ participants, total: participants.length });
}

// ----------------------------------------------------------------------
// 5. LEADS DO LANÇAMENTO (spec 13.3 & 13.4)
// ----------------------------------------------------------------------
export async function listLaunchLeads(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  let participants = mockDb.launchParticipants.filter((p) => p.launchId === id);

  const { status, classification, search, sort } = req.query as Record<string, string>;

  if (status && status !== "ALL") {
    if (status === "INACTIVE") {
      participants = participants.filter((p) => p.status === "LEFT" || p.status === "BLOCKED");
    } else {
      participants = participants.filter((p) => p.status === status);
    }
  }

  if (classification && classification !== "ALL") {
    participants = participants.filter((p) => p.classification === classification);
  }

  if (search) {
    const term = search.toLowerCase().trim();
    participants = participants.filter(
      (p) => p.phone.includes(term) || (p.name && p.name.toLowerCase().includes(term))
    );
  }

  // Ordenação
  if (sort === "score_desc") participants.sort((a, b) => b.engagementScore - a.engagementScore);
  else if (sort === "score_asc") participants.sort((a, b) => a.engagementScore - b.engagementScore);
  else if (sort === "oldest") participants.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  else participants.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));

  const allInLaunch = mockDb.launchParticipants.filter((p) => p.launchId === id);
  const counts = {
    total: allInLaunch.length,
    active: allInLaunch.filter((p) => p.status === "ACTIVE").length,
    inactive: allInLaunch.filter((p) => p.status === "LEFT" || p.status === "BLOCKED").length,
    left: allInLaunch.filter((p) => p.status === "LEFT").length,
    blocked: allInLaunch.filter((p) => p.status === "BLOCKED").length,
  };

  res.json({ leads: participants, counts });
}

export async function enrichLeads(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const launch = mockDb.launches.find((l) => l.id === id);
  if (!launch) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  const participants = mockDb.launchParticipants.filter((p) => p.launchId === id);
  let enrichedCount = 0;

  for (const part of participants) {
    const crmLead = mockDb.leads.find((l) => l.phone === part.phone && l.clientId === launch.clientId);
    if (crmLead) {
      part.crmLeadId = crmLead.id;
      part.name = crmLead.name;
      enrichedCount += 1;
    }
  }

  res.json({
    success: true,
    enrichedCount,
    totalCount: participants.length,
    message: `${enrichedCount} de ${participants.length} leads vinculados ao CRM com sucesso!`,
  });
}

export async function exportLeadsCsv(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const participants = mockDb.launchParticipants.filter((p) => p.launchId === id);

  let csv = "Telefone,Nome,Status,Classificacao,Pontos,Grupos,Entrada,Saida\n";
  for (const p of participants) {
    csv += `"${p.phone}","${p.name || ""}","${p.status}","${p.classification}",${p.engagementScore},"${p.groupIds.join(";") || ""}","${p.joinedAt}","${p.leftAt || ""}"\n`;
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=leads_${id}.csv`);
  res.send(csv);
}

// ----------------------------------------------------------------------
// 6. MENSAGENS E MSG PRIVADAS (spec 14.2 & 14.3)
// ----------------------------------------------------------------------
export async function listLaunchMessages(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const messages = mockDb.launchMessages.filter((m) => m.launchId === id && m.targetType !== "PRIVATE_ACTIVE_LEADS");
  res.json({ messages });
}

export async function createLaunchMessage(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const {
    title,
    type,
    content,
    mediaUrl,
    pollOptions,
    pollMaxAnswers,
    scheduledAt,
    targetType = "ALL_GROUPS",
    selectedGroupIds,
    mentionAll,
    linkPreview,
    delayMinSeconds = 5,
    delayMaxSeconds = 15,
  } = req.body;

  if (type === "POLL") {
    if (!pollOptions || !Array.isArray(pollOptions) || pollOptions.length < 2) {
      res.status(400).json({ error: "Enquetes exigem no mínimo 2 opções." });
      return;
    }
  }

  const newMsg: MockLaunchMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    launchId: id,
    title: title || "Mensagem",
    type: type || "TEXT",
    content: content || "",
    mediaUrl: mediaUrl || null,
    pollOptions: pollOptions || [],
    pollMaxAnswers: Number(pollMaxAnswers) || 1,
    scheduledAt: scheduledAt || null,
    status: scheduledAt ? "SCHEDULED" : "SENT",
    targetType,
    selectedGroupIds: selectedGroupIds || [],
    mentionAll: Boolean(mentionAll),
    linkPreview: Boolean(linkPreview),
    delayMinSeconds: Number(delayMinSeconds) || 5,
    delayMaxSeconds: Number(delayMaxSeconds) || 15,
    deliveries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDb.launchMessages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg });
}

export async function cancelLaunchMessage(req: Request, res: Response): Promise<void> {
  const { id, messageId } = req.params;
  const msg = mockDb.launchMessages.find((m) => m.launchId === id && m.id === messageId);
  if (!msg) {
    res.status(404).json({ error: "Mensagem não encontrada" });
    return;
  }

  msg.status = "CANCELED";
  msg.updatedAt = new Date().toISOString();
  res.json({ success: true, message: msg });
}

export async function listPrivateMessages(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const messages = mockDb.launchMessages.filter((m) => m.launchId === id && m.targetType === "PRIVATE_ACTIVE_LEADS");
  res.json({ messages });
}

export async function createPrivateMessage(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { title, type, content, mediaUrl, scheduledAt, delayMinSeconds = 5, delayMaxSeconds = 15 } = req.body;

  const activeParticipants = mockDb.launchParticipants.filter((p) => p.launchId === id && p.status === "ACTIVE");

  const newMsg: MockLaunchMessage = {
    id: `pmsg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    launchId: id,
    title: title || "Mensagem Privada",
    type: type || "TEXT",
    content: content || "",
    mediaUrl: mediaUrl || null,
    scheduledAt: scheduledAt || null,
    status: scheduledAt ? "SCHEDULED" : "SENT",
    targetType: "PRIVATE_ACTIVE_LEADS",
    delayMinSeconds: Number(delayMinSeconds) || 5,
    delayMaxSeconds: Number(delayMaxSeconds) || 15,
    deliveries: activeParticipants.map((p) => ({
      targetId: p.phone,
      targetName: p.name || p.phone,
      status: "SENT",
      sentAt: new Date().toISOString(),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDb.launchMessages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg, targetCount: activeParticipants.length });
}

// ----------------------------------------------------------------------
// 7. AÇÕES AGENDADAS (spec 14.4)
// ----------------------------------------------------------------------
export async function listLaunchActions(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const actions = mockDb.launchScheduledActions.filter((a) => a.launchId === id);
  res.json({ actions });
}

export async function createLaunchAction(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { type, payload, scheduledAt, applyToFuture, applyToAllGroups, selectedGroupIds } = req.body;

  const newAction: MockLaunchScheduledGroupAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    launchId: id,
    type,
    payload: payload || "",
    scheduledAt: scheduledAt || new Date().toISOString(),
    applyToFuture: Boolean(applyToFuture),
    applyToAllGroups: Boolean(applyToAllGroups),
    selectedGroupIds: selectedGroupIds || [],
    status: "SCHEDULED",
    createdAt: new Date().toISOString(),
  };

  mockDb.launchScheduledActions.push(newAction);
  res.status(201).json({ success: true, action: newAction });
}

export async function cancelLaunchAction(req: Request, res: Response): Promise<void> {
  const { id, actionId } = req.params;
  const act = mockDb.launchScheduledActions.find((a) => a.launchId === id && a.id === actionId);
  if (!act) {
    res.status(404).json({ error: "Ação não encontrada" });
    return;
  }

  act.status = "CANCELED";
  res.json({ success: true, action: act });
}

// ----------------------------------------------------------------------
// 8. ANALYTICS, INBOX IA E WEBHOOKS (spec 15.2, 15.3, 15.4)
// ----------------------------------------------------------------------
export async function getLaunchAnalytics(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const launch = mockDb.launches.find((l) => l.id === id);
  if (!launch) {
    res.status(404).json({ error: "Lançamento não encontrado" });
    return;
  }

  const groups = mockDb.launchGroups.filter((g) => g.launchId === id);
  const participants = mockDb.launchParticipants.filter((p) => p.launchId === id);
  const clicks = mockDb.launchClicks.filter((c) => c.launchId === id);

  const totalEntries = participants.length;
  const activeLeads = participants.filter((p) => p.status === "ACTIVE").length;
  const totalExits = participants.filter((p) => p.status === "LEFT").length;
  const totalClicks = clicks.length;
  const conversionRate = totalClicks > 0 ? Number(((totalEntries / totalClicks) * 100).toFixed(1)) : 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // UTM breakdown
  const utmGroups: Record<string, { source: string; medium: string; campaign: string; clicks: number; entries: number }> = {};
  for (const c of clicks) {
    const key = `${c.utmSource || "(direto)"}|${c.utmMedium || "(nenhum)"}|${c.utmCampaign || "(nenhuma)"}`;
    if (!utmGroups[key]) {
      utmGroups[key] = {
        source: c.utmSource || "(direto)",
        medium: c.utmMedium || "(nenhum)",
        campaign: c.utmCampaign || "(nenhuma)",
        clicks: 0,
        entries: 0,
      };
    }
    utmGroups[key].clicks += 1;
    // se visitorId virou participante
    utmGroups[key].entries += 1;
  }

  const utmTable = Object.values(utmGroups).map((u) => ({
    ...u,
    conversion: u.clicks > 0 ? Number(((u.entries / u.clicks) * 100).toFixed(1)) : 0,
  }));

  res.json({
    totalLeads: totalEntries,
    totalClicks,
    totalEntries,
    conversionRatePct: conversionRate,
    activeLeads,
    totalExits,
    retentionRatePct: totalEntries > 0 ? Number(((activeLeads / totalEntries) * 100).toFixed(1)) : 0,
    quickBounceCount: 1, // saiu em menos de 10 min
    avgTimeToJoinMinutes: 8,
    activeSpoken7d: Math.round(activeLeads * 0.4),
    activeSpoken7dPct: 40,
    leads7d: totalEntries,
    entriesToday: participants.filter((p) => p.joinedAt >= todayStart.toISOString()).length,
    exitsToday: totalExits,
    hourlyFlow: [
      { hour: "08h", count: 12 },
      { hour: "10h", count: 34 },
      { hour: "12h", count: 48 },
      { hour: "14h", count: 32 },
      { hour: "16h", count: 28 },
      { hour: "18h", count: 56 },
      { hour: "20h", count: 72 },
      { hour: "22h", count: 40 },
    ],
    groupsBreakdown: groups.map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount,
      maxMembers: g.maxMembers,
      retentionRate: 92.5,
      entries7d: g.memberCount,
      exits7d: 2,
      speedPerHour: 4.2,
      fillProjectionDate: "15/10/2026",
    })),
    groupPerformance: groups.map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount,
      maxMembers: g.maxMembers,
      occupancyPct: Math.round((g.memberCount / g.maxMembers) * 100),
      exitsCount: 2,
    })),
    utmTable,
    utmSources: utmTable.map((u) => ({
      source: u.source,
      count: u.entries,
      pct: u.conversion,
    })),
  });
}

export async function listLaunchInbox(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const status = req.query.status as string;
  let messages = mockDb.launchInboxMessages.filter((m) => m.launchId === id);
  if (status && status !== "ALL") {
    messages = messages.filter((m) => m.status === status);
  }
  res.json({ messages });
}

export async function sendInboxReply(req: Request, res: Response): Promise<void> {
  const { id, itemId } = req.params;
  const { text } = req.body;
  const item = mockDb.launchInboxMessages.find((m) => m.launchId === id && m.id === itemId);
  if (!item) {
    res.status(404).json({ error: "Mensagem não encontrada" });
    return;
  }

  item.status = "SENT";
  item.replyText = text || item.suggestedReply || "";
  item.repliedAt = new Date().toISOString();

  res.json({ success: true, item });
}

export async function rejectInboxReply(req: Request, res: Response): Promise<void> {
  const { id, itemId } = req.params;
  const item = mockDb.launchInboxMessages.find((m) => m.launchId === id && m.id === itemId);
  if (!item) {
    res.status(404).json({ error: "Mensagem não encontrada" });
    return;
  }

  item.status = "REJECTED";
  res.json({ success: true, item });
}

export async function ignoreInboxReply(req: Request, res: Response): Promise<void> {
  const { id, itemId } = req.params;
  const item = mockDb.launchInboxMessages.find((m) => m.launchId === id && m.id === itemId);
  if (!item) {
    res.status(404).json({ error: "Mensagem não encontrada" });
    return;
  }

  item.status = "IGNORED";
  res.json({ success: true, item });
}

export async function listWebhooks(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const webhooks = mockDb.launchWebhooks.filter((w) => w.launchId === id);
  res.json({ webhooks });
}

export async function createWebhook(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { name, targetUrl, events } = req.body;

  const newWebhook: MockLaunchWebhook = {
    id: `whk_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    launchId: id,
    name: name || "Webhook",
    targetUrl: targetUrl || "",
    events: events || ["LEAD_JOINED"],
    secret: `whsec_${Math.random().toString(36).substring(2, 12)}`,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  mockDb.launchWebhooks.push(newWebhook);
  res.status(201).json({ success: true, webhook: newWebhook });
}

export async function testWebhook(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const webhookId = String(req.params.webhookId);
  const webhook = mockDb.launchWebhooks.find((w) => w.launchId === id && w.id === webhookId);
  if (!webhook) {
    res.status(404).json({ error: "Webhook não encontrado" });
    return;
  }

  const delivery: MockLaunchWebhookDelivery = {
    id: `del_${Date.now()}`,
    webhookId,
    launchId: id,
    event: "TEST",
    status: 200,
    occurredAt: new Date().toISOString(),
    payload: { test: true, message: "Teste de envio de webhook do Growth OS" },
  };

  mockDb.launchWebhookDeliveries.unshift(delivery);
  res.json({ success: true, delivery });
}

export async function listWebhookDeliveries(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const webhookId = String(req.params.webhookId);
  const deliveries = mockDb.launchWebhookDeliveries.filter((d) => d.launchId === id && d.webhookId === webhookId);
  res.json({ deliveries: deliveries.slice(0, 20) });
}

// ----------------------------------------------------------------------
// 10. COMPATIBILIDADE & WEBHOOK PARTICIPANTES DO WHATSAPP (spec 13.1)
// ----------------------------------------------------------------------
export async function listLaunchGroups(req: Request, res: Response): Promise<void> {
  const { launchId } = req.query;
  let groups = mockDb.launchGroups;
  if (launchId) {
    groups = groups.filter((g) => g.launchId === String(launchId));
  }
  res.json({ groups });
}

export async function toggleGroupStatus(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const group = mockDb.launchGroups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }
  if (req.body.status) group.status = req.body.status;
  res.json({ success: true, group });
}

export async function handleGroupParticipantWebhook(req: Request, res: Response): Promise<void> {
  const { groupId, phone, name, action } = req.body;
  if (!groupId || !phone) {
    res.status(400).json({ error: "groupId e phone são obrigatórios" });
    return;
  }

  const group = mockDb.launchGroups.find((g) => g.id === groupId);
  if (!group) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }

  let participant = mockDb.launchParticipants.find(
    (p) => p.launchId === group.launchId && p.phone === phone
  );

  if (action === "leave") {
    if (participant) {
      participant.status = "LEFT";
      participant.leftAt = new Date().toISOString();
      participant.groupIds = participant.groupIds.filter((gid) => gid !== groupId);
    }
    group.memberCount = Math.max(0, group.memberCount - 1);
  } else {
    // join
    if (!participant) {
      const newParticipant: MockLaunchParticipant = {
        id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        launchId: group.launchId,
        phone,
        name: name || null,
        groupIds: [groupId],
        status: "ACTIVE",
        engagementScore: 50,
        classification: "WARM",
        joinedAt: new Date().toISOString(),
      };
      mockDb.launchParticipants.push(newParticipant);
      participant = newParticipant;
    } else {
      participant.status = "ACTIVE";
      participant.leftAt = null;
      if (!participant.groupIds.includes(groupId)) {
        participant.groupIds.push(groupId);
      }
    }
    group.memberCount = Math.min(group.maxMembers, group.memberCount + 1);
  }

  res.json({ success: true, participant, group });
}

