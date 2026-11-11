import { Router, Request, Response } from "express";
import { mockDb } from "../services/mockDb.js";
import { getAgencyDashboard, getClientDashboard, exportExecutiveReport } from "../modules/dashboard/dashboard.controller.js";
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleChecklistItem,
  deleteTask,
  listTaskComments,
  createTaskComment,
  listTaskHistory,
  getTaskConfig,
  updateTaskConfig,
  approveTask,
  requestTaskChanges,
} from "../modules/tasks/task.controller.js";
import {
  listTaskRoutines,
  createTaskRoutine,
  updateTaskRoutine,
  deleteTaskRoutine,
  listClientRoutines,
  setClientRoutine,
  endSeriesController,
} from "../modules/tasks/routine.controller.js";
import {
  handleLaunchRedirect,
  listLaunches,
  createLaunch,
  getLaunchById,
  updateLaunch,
  deleteLaunch,
  getLaunchDashboard,
  listGroups,
  enqueueGroups,
  linkExistingGroup,
  getLinkableGroups,
  syncGroups,
  updateGroup,
  removeGroup,
  getGroupParticipants,
  listLaunchLeads,
  enrichLeads,
  exportLeadsCsv,
  listLaunchMessages,
  createLaunchMessage,
  cancelLaunchMessage,
  listPrivateMessages,
  createPrivateMessage,
  listLaunchActions,
  createLaunchAction,
  cancelLaunchAction,
  getLaunchAnalytics,
  listLaunchInbox,
  sendInboxReply,
  rejectInboxReply,
  ignoreInboxReply,
  listWebhooks,
  createWebhook,
  testWebhook,
  listWebhookDeliveries,
  listLaunchGroups,
  toggleGroupStatus,
  handleGroupParticipantWebhook,
} from "../modules/launches/launch.controller.js";
import {
  listInstances,
  createInstance,
  toggleInstanceStatus,
  connectInstance,
  listChats,
  openChat,
  sendChatMessage,
  previewSendGate,
  getWarmingNetwork,
  toggleWarmingPair,
  triggerWarmingStep,
  searchLeadRadar,
  importLeadRadar,
} from "../modules/whatsapp/whatsapp.controller.js";
import {
  listLeads,
  createLead,
  updateLead,
  deleteLead,
  listSales,
  createSale,
  listProducts,
  listRecovery,
  updateRecoveryStatus,
  importCsv,
  listAutomations,
  updateAutomation,
  checkBirthdayLeads,
  listSubscriptions,
  listNotifications,
  markNotificationRead,
  getCrmSettings,
  updateCrmSettings,
} from "../modules/crm/crm.controller.js";
import {
  listMediaJobs,
  createCaptionJob,
  listSpeakers,
  addSpeaker,
  exportJobMarkdown,
  initChunkUpload,
  receiveChunk,
  completeChunkUpload,
  getChunkUploadStatus,
} from "../modules/media/media.controller.js";
import {
  handleKiwifyWebhook,
  handleHotmartWebhook,
  handleEduzzWebhook,
  simulateWebhook,
  getLeadTimeline,
} from "../modules/webhooks/webhook.controller.js";
import {
  listConversionRules,
  createConversionRule,
  updateConversionRule,
  deleteConversionRule,
  listReviewQueue,
  approveReviewQueueItem,
  rejectReviewQueueItem,
  listAuditLogs,
  updateConversionSettings,
  createWebsiteTrackingClick,
  handleInboundWhatsAppMessage,
  markManualSale,
} from "../modules/conversions/conversion.controller.js";
import { requireGrowthRoles } from "../middlewares/rbacMiddleware.js";
import { eventBus } from "../services/eventBus.js";

const router = Router();

// Real-Time Server-Sent Events (SSE) Bus
router.get("/api/events/stream", (req, res) => eventBus.registerClient(res));

// Public Launch Redirection (SendFlow style: /l/:slug)
router.get("/l/:slug", handleLaunchRedirect);

// Dashboard & Reports Routes (Agency dashboard is restricted to Agency roles)
router.get("/api/dashboard/agency", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), getAgencyDashboard);
router.get("/api/dashboard/client/:clientId?", getClientDashboard);
router.get("/api/reports/export/:format?", exportExecutiveReport);

// Tasks Routes (ClickUp style)
router.get("/api/tasks", listTasks);
router.get("/api/tasks/config", getTaskConfig);
router.patch("/api/tasks/config", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), updateTaskConfig);
router.get("/api/tasks/:id", getTaskById);
router.post("/api/tasks", createTask);
router.patch("/api/tasks/:id", updateTask);
router.patch("/api/tasks/:id/status", updateTaskStatus);
router.patch("/api/tasks/:id/checklist/:checklistId", toggleChecklistItem);
router.delete("/api/tasks/:id", deleteTask);
router.get("/api/tasks/:id/comments", listTaskComments);
router.post("/api/tasks/:id/comments", createTaskComment);
router.get("/api/tasks/:id/history", listTaskHistory);
router.post("/api/tasks/:id/approve", approveTask);
router.post("/api/tasks/:id/request-changes", requestTaskChanges);
router.post("/api/tasks/:id/end-series", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), endSeriesController);

// Task Routines Routes (spec 9.2)
router.get("/api/task-routines", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), listTaskRoutines);
router.post("/api/task-routines", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), createTaskRoutine);
router.patch("/api/task-routines/:id", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), updateTaskRoutine);
router.delete("/api/task-routines/:id", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), deleteTaskRoutine);
router.get("/api/clients/routines", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), listClientRoutines);
router.put("/api/clients/:clientId/task-routines/:routineId", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), setClientRoutine);


// Users (Assignees) Route - Agency roles only
router.get("/api/users", requireGrowthRoles("MASTER_AGENCY", "AGENCY_OPERATOR"), (req: Request, res: Response) => {
  const { assignable } = req.query;
  let users = mockDb.users;
  if (assignable === "true") {
    users = users.filter((u) => u.role !== "CLIENT");
  }
  res.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
    })),
  });
});

// Agency Agent Interactive Consultation Route
router.post("/api/agents/consult", (req: Request, res: Response) => {
  const { agentId, query, context } = req.body;
  const agentName = agentId || "ui-designer";

  const agentTemplates: Record<string, { role: string; specialty: string; execute: (q: string, c?: string) => string }> = {
    "ui-designer": {
      role: "UI Designer",
      specialty: "Visual design, component libraries, design systems",
      execute: (q) => `### 🎯 Parecer do UI Designer
**Diretiva de Interface para**: "${q}"

1. **Tokens Visuais & Paleta HSL Refinada**:
   - \`--accent-primary\`: \`hsl(158, 64%, 52%)\` (Emerald vibrante com contraste WCAG AAA sobre dark bg)
   - \`--surface-card\`: \`rgba(18, 24, 38, 0.75)\` com backdrop-filter blur 12px
   - \`--border-focus\`: \`1px solid rgba(16, 185, 129, 0.45)\`

2. **Hierarquia & Componentes**:
   - Tipografia: Inter / Outfit com escala modular 1.25 (\`0.85rem\`, \`1.0rem\`, \`1.25rem\`, \`1.8rem\`).
   - Estados de Botão: \`hover: translateY(-1px)\`, \`active: scale(0.98)\`, feedback tátil.
   - Micro-espaçamento: Grid de 4px/8px para zero desalinhamento visual.`
    },
    "ux-researcher": {
      role: "UX Researcher",
      specialty: "User testing, behavior analysis, research",
      execute: (q) => `### 🔍 Diagnóstico do UX Researcher
**Investigação Heurística & Pesquisa para**: "${q}"

1. **Mapa de Fricção do Usuário**:
   - Carga Cognitiva: Reduzir decisões paralelas no primeiro viewport para no máximo 1 ação primária.
   - Fator de Ansiedade: Adicionar micro-provas de segurança (ex: SSL, garantia de reembolso, tempo médio de resposta).
2. **Roteiro de Teste de Usabilidade (5 Usuários)**:
   - Tarefa: "Encontre onde ativar a integração e configure em menos de 2 minutos."
   - Métrica: Time-on-Task < 90s, taxa de sucesso sem hesitação > 85%.`
    },
    "ux-architect": {
      role: "UX Architect",
      specialty: "Technical architecture, CSS systems, implementation",
      execute: (q) => `### 🏛️ Especificação do UX Architect
**Fundação Técnica & Sistema CSS para**: "${q}"

1. **Layout Architecture**:
   - Layout CSS Grid com subgrid para alinhamento uniforme de cabeçalhos e CTAs.
   - Zero Layout Shift (CLS = 0): Reservar dimensões de mídia e componentes dinâmicos.
2. **Design Tokens & Variáveis Reutilizáveis**:
   - Estrutura semântica token-to-class isolada de frameworks invasivos.
   - Suporte completo a navegação por teclado (\`:focus-visible\`) e leitor de tela (ARIA roles).`
    },
    "brand-guardian": {
      role: "Brand Guardian",
      specialty: "Brand identity, consistency, positioning",
      execute: (q) => `### 🎭 Diretriz do Brand Guardian
**Posicionamento & Coerência de Marca para**: "${q}"

1. **Voz & Tom GFB Growth OS**:
   - Tom: Autoritário, de alta performance, data-driven, sem jargões vazios.
   - Regra de Ouro: "Nunca mostre um dado sem indicar a próxima ação recomendada."
2. **Fidelidade Visual**:
   - Cores Proibidas: Tons neon saturados sem contraste ou gradientes genéricos de template.
   - Aplicação de Logo & Selos: Margem de respiro mínima de 24px em qualquer viewport.`
    },
    "visual-storyteller": {
      role: "Visual Storyteller",
      specialty: "Visual narratives, multimedia content",
      execute: (q) => `### 📖 Storyboard do Visual Storyteller
**Narrativa Visual & Arco de Conversão para**: "${q}"

1. **Ato 1 (A Dor Invisível)**: Visual que expõe o gargalo operacional ou perda de leads/vendas.
2. **Ato 2 (O Ponto de Virada)**: O sistema agindo em tempo real (gráficos subindo, lead entrando).
3. **Ato 3 (O Alívio & Controle Total)**: Dashboard limpo com métricas verdes e o time focado no estratégico.
- Ritmo de Vídeo (9:16): Cortes dinâmicos a cada 2.5s com texto em karaoke cyan nos ganchos.`
    },
    "whimsy-injector": {
      role: "Whimsy Injector",
      specialty: "Personality, delight, playful interactions",
      execute: (q) => `### ✨ Toques de Encantamento (Whimsy Injector)
**Micro-interações e Momentos de Deleite para**: "${q}"

1. **Micro-Interação de Sucesso**:
   - Ao concluir uma meta ou fechar uma venda, disparar celebração sutil de confetes dourados/esmeralda no canto da tela.
2. **Feedback Visual Surpreendente**:
   - Botões de ação com brilho suave (\`shimmer effect\`) que reage à velocidade do cursor.
   - Empty States bem-humorados: "Tudo limpo por aqui! Seus robôs cuidaram de tudo enquanto você tomava um café ☕."`
    },
    "image-prompt-engineer": {
      role: "Image Prompt Engineer",
      specialty: "AI image generation prompts, photography",
      execute: (q) => `### 📷 Prompt Master do Image Prompt Engineer
**Prompt Otimizado para**: "${q}"

**Midjourney v6.0 / Flux.1 Prompt**:
\`\`\`text
high-end direct response visual, cinematic commercial photography, ${q}, editorial lighting, subtle volumetric atmosphere, shot on 85mm f/1.4 lens, 8k resolution, authentic textures, hyper-detailed, clean modern dark aesthetic --ar 16:9 --style raw --v 6.0
\`\`\`

**Variação Vertical (9:16 Reels/Stories)**:
\`\`\`text
vertical 9:16 smartphone ad visual, hero product presentation, ${q}, eye-level perspective, striking contrast, studio rim lighting, luxury modern vibe --ar 9:16 --v 6.0
\`\`\`
- **Dica de Direção**: Mantenha o terço superior desimpedido para aplicação de headline sem poluição visual.`
    },
    "inclusive-visuals": {
      role: "Inclusive Visuals Specialist",
      specialty: "Representation, bias mitigation, authentic imagery",
      execute: (q) => `### 🌈 Auditoria do Inclusive Visuals Specialist
**Equidade & Representatividade Autêntica para**: "${q}"

1. **Mitigação de Estereótipos de IA**:
   - Evitar poses estáticas artificiais de banco de imagens corporativo.
   - Retratar lideranças femininas, diversas etnias e contextos reais de trabalho sem tokenismo.
2. **Iluminação & Tom de Pele**:
   - Usar iluminação quente de difusão suave para preservar tons naturais de pele em fotos e vídeos.`
    },
    "persona-walkthrough": {
      role: "Persona Walkthrough Specialist",
      specialty: "Persona-driven cognitive walkthroughs",
      execute: (q) => `### 🎭 Simulação de Rolagem (Persona Walkthrough)
**Reação Cognitiva de 3 Personas para**: "${q}"

1. **Persona A: O Gestor de Tráfego Cético**:
   - *Dobra 1*: "Isso realmente tem CAPI direto sem passar por servidor terceiro lento?" -> **Solução**: Mostrar logo da Meta API e badge EMQ 8.8 logo no topo.
2. **Persona B: O Dono da Agência Ocupado**:
   - *Dobra 2*: "Quanto tempo minha equipe perde configurando isso?" -> **Solução**: Destacar botão "1-Clique para conectar".
3. **Persona C: O Cliente Final no Celular**:
   - *Dobra 3*: Botões grandes de toque com área de 48px e navegação com uma só mão.`
    },
    "ui-finish-gate": {
      role: "UI Finish-Gate Reviewer",
      specialty: "Anti-generic UI finish gate",
      execute: (q) => `### 🧱 Veredito do UI Finish-Gate Reviewer
**Hard Finish-Gate Audit para**: "${q}"

- **Critério 1: Anti-Generic AI Check**: 🟢 PASS (Uso de dados reais, paleta personalizada, tipografia estruturada).
- **Critério 2: Densidade de Informação**: 🟢 PASS (Informações críticas agrupadas sem espaço desperdiçado).
- **Critério 3: Real Product Job**: 🟢 PASS (Cada card possui uma ação direta e clara de negócio).
- **Critério 4: Ergonomia Mobile (48px tap targets)**: 🟢 PASS.
- **Critério 5: Zero Clutter**: 🟢 PASS (Sem elementos decorativos inúteis).

**VEREDITO FINAL: PASS ✅** (Interface pronta para homologação e publicação sem ressalvas).`
    }
  };

  const selectedAgent = agentTemplates[agentName] || agentTemplates["ui-designer"];
  const responseMarkdown = selectedAgent.execute(query || "Interface do Sistema GFB Digital", context);

  res.json({
    agentId: agentName,
    agentName: selectedAgent.role,
    specialty: selectedAgent.specialty,
    responseMarkdown,
    timestamp: new Date().toISOString(),
  });
});

// Launches (SendFlow style - Partes 6, 7, 8, 9)
router.get("/api/launches", listLaunches);
router.post("/api/launches", createLaunch);

// WhatsApp group routes (placed before :id to prevent Express route shadowing)
router.get("/api/launches/groups", listLaunchGroups);
router.patch("/api/launches/groups/:id", toggleGroupStatus);
router.post("/api/launches/participant-webhook", handleGroupParticipantWebhook);

router.get("/api/launches/:id", getLaunchById);
router.patch("/api/launches/:id", updateLaunch);
router.delete("/api/launches/:id", deleteLaunch);
router.get("/api/launches/:id/dashboard", getLaunchDashboard);

// Launch Groups
router.get("/api/launches/:id/groups", listGroups);
router.post("/api/launches/:id/groups", enqueueGroups);
router.post("/api/launches/:id/groups/link", linkExistingGroup);
router.get("/api/launches/:id/groups/linkable", getLinkableGroups);
router.post("/api/launches/:id/groups/sync", syncGroups);
router.patch("/api/launches/:id/groups/:groupId", updateGroup);
router.delete("/api/launches/:id/groups/:groupId", removeGroup);
router.get("/api/launches/:id/groups/:groupId/participants", getGroupParticipants);

// Launch Leads
router.get("/api/launches/:id/leads", listLaunchLeads);
router.post("/api/launches/:id/leads/enrich", enrichLeads);
router.get("/api/launches/:id/leads/export.csv", exportLeadsCsv);

// Launch Messages
router.get("/api/launches/:id/messages", listLaunchMessages);
router.post("/api/launches/:id/messages", createLaunchMessage);
router.delete("/api/launches/:id/messages/:messageId", cancelLaunchMessage);
router.get("/api/launches/:id/private-messages", listPrivateMessages);
router.post("/api/launches/:id/private-messages", createPrivateMessage);

// Launch Scheduled Actions
router.get("/api/launches/:id/actions", listLaunchActions);
router.post("/api/launches/:id/actions", createLaunchAction);
router.delete("/api/launches/:id/actions/:actionId", cancelLaunchAction);

// Launch Analytics, Inbox IA, Webhooks
router.get("/api/launches/:id/analytics", getLaunchAnalytics);
router.get("/api/launches/:id/inbox", listLaunchInbox);
router.post("/api/launches/:id/inbox/:inboxId/send", sendInboxReply);
router.post("/api/launches/:id/inbox/:inboxId/reject", rejectInboxReply);
router.post("/api/launches/:id/inbox/:inboxId/ignore", ignoreInboxReply);
router.get("/api/launches/:id/webhooks", listWebhooks);
router.post("/api/launches/:id/webhooks", createWebhook);
router.post("/api/launches/:id/webhooks/:webhookId/test", testWebhook);
router.get("/api/launches/:id/webhooks/:webhookId/deliveries", listWebhookDeliveries);


// WhatsApp & Aquecedor Routes
router.get("/api/whatsapp/instances", listInstances);
router.post("/api/whatsapp/instances", createInstance);
router.patch("/api/whatsapp/instances/:instanceKey", toggleInstanceStatus);
router.get("/api/whatsapp/connect/:instanceKey?", connectInstance);
router.get("/api/whatsapp/chats", listChats);
router.post("/api/whatsapp/chats/open", openChat);
router.post("/api/whatsapp/chats/send", sendChatMessage);
router.post("/api/whatsapp/sendgate/preview", previewSendGate);
router.get("/api/whatsapp/warming", getWarmingNetwork);
router.patch("/api/whatsapp/warming/pairs/:pairId", toggleWarmingPair);
router.post("/api/whatsapp/warming/pairs/:pairId/step", triggerWarmingStep);
router.get("/api/whatsapp/leadradar", searchLeadRadar);
router.post("/api/whatsapp/leadradar/import", importLeadRadar);

// CRM, Leads, Sales & Recovery Routes
router.get("/api/crm/leads", listLeads);
router.post("/api/crm/leads", createLead);
router.patch("/api/crm/leads/:id", updateLead);
router.delete("/api/crm/leads/:id", deleteLead);
router.get("/api/crm/leads/:id/timeline", getLeadTimeline);

router.get("/api/crm/sales", listSales);
router.post("/api/crm/sales", createSale);
router.get("/api/crm/products", listProducts);
router.get("/api/crm/recovery", listRecovery);
router.patch("/api/crm/recovery/:id", updateRecoveryStatus);
router.post("/api/crm/import-csv", importCsv);
router.post("/api/crm/leads/import-csv", importCsv);

// Automations Routes
router.get("/api/crm/automations", listAutomations);
router.patch("/api/crm/automations/:id", updateAutomation);
router.get("/api/crm/automations/birthday-check", checkBirthdayLeads);

// Subscriptions Routes
router.get("/api/crm/subscriptions", listSubscriptions);

// Notifications Routes
router.get("/api/crm/notifications", listNotifications);
router.patch("/api/crm/notifications/:id/read", markNotificationRead);

// Settings Routes
router.get("/api/crm/settings", getCrmSettings);
router.patch("/api/crm/settings", updateCrmSettings);

// Conversions & WhatsApp Triggers Routes (Negócios Locais)
router.get("/api/crm/conversions/rules", listConversionRules);
router.post("/api/crm/conversions/rules", createConversionRule);
router.patch("/api/crm/conversions/rules/:id", updateConversionRule);
router.delete("/api/crm/conversions/rules/:id", deleteConversionRule);

router.get("/api/crm/conversions/review-queue", listReviewQueue);
router.post("/api/crm/conversions/review-queue/:id/approve", approveReviewQueueItem);
router.post("/api/crm/conversions/review-queue/:id/reject", rejectReviewQueueItem);

router.get("/api/crm/conversions/audit-logs", listAuditLogs);
router.patch("/api/crm/conversions/settings", updateConversionSettings);
router.post("/api/whatsapp/click-redirect", createWebsiteTrackingClick);
router.post("/api/whatsapp/inbound-webhook", handleInboundWhatsAppMessage);
router.post("/api/crm/conversions/mark-sale", markManualSale);

// Payment & Checkout Webhooks (Identity Graph & CAPI)
router.post("/api/webhooks/kiwify", handleKiwifyWebhook);
router.post("/api/webhooks/hotmart", handleHotmartWebhook);
router.post("/api/webhooks/eduzz", handleEduzzWebhook);
router.post("/api/webhooks/simulate", simulateWebhook);

// Media & Video AI Routes
router.get("/api/media/jobs", listMediaJobs);
router.post("/api/media/caption", createCaptionJob);
router.get("/api/media/speakers", listSpeakers);
router.post("/api/media/speakers", addSpeaker);
router.get("/api/media/jobs/:id/export", exportJobMarkdown);
router.post("/api/media/upload/init", initChunkUpload);
router.post("/api/media/upload/chunk", receiveChunk);
router.post("/api/media/upload/complete", completeChunkUpload);
router.get("/api/media/upload/:uploadId", getChunkUploadStatus);

export const apiRoutes = router;


