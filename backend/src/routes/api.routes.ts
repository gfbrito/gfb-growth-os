import { Router } from "express";
import { getAgencyDashboard, getClientDashboard, exportExecutiveReport } from "../modules/dashboard/dashboard.controller.js";
import { listTasks, createTask, updateTaskStatus, toggleChecklistItem, deleteTask } from "../modules/tasks/task.controller.js";
import {
  listLaunches,
  listLaunchGroups,
  toggleGroupStatus,
  handleLaunchRedirect,
  handleGroupParticipantWebhook,
} from "../modules/launches/launch.controller.js";
import {
  listInstances,
  createInstance,
  toggleInstanceStatus,
  connectInstance,
  listChats,
  sendChatMessage,
  previewSendGate,
  getWarmingNetwork,
  toggleWarmingPair,
  triggerWarmingStep,
  searchLeadRadar,
  importLeadRadar,
} from "../modules/whatsapp/whatsapp.controller.js";
import { listLeads, listSales, listProducts, listRecovery, updateRecoveryStatus, importCsv } from "../modules/crm/crm.controller.js";
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
import { eventBus } from "../services/eventBus.js";

const router = Router();

// Real-Time Server-Sent Events (SSE) Bus
router.get("/api/events/stream", (req, res) => eventBus.registerClient(res));

// Public Launch Redirection (SendFlow style: /l/:slug)
router.get("/l/:slug", handleLaunchRedirect);

// Dashboard & Reports Routes
router.get("/api/dashboard/agency", getAgencyDashboard);
router.get("/api/dashboard/client/:clientId?", getClientDashboard);
router.get("/api/reports/export/:format?", exportExecutiveReport);

// Tasks Routes (ClickUp style)
router.get("/api/tasks", listTasks);
router.post("/api/tasks", createTask);
router.patch("/api/tasks/:id", updateTaskStatus);
router.patch("/api/tasks/:id/checklist/:checklistId", toggleChecklistItem);
router.delete("/api/tasks/:id", deleteTask);

// Launches & Groups Routes (SendFlow style)
router.get("/api/launches", listLaunches);
router.get("/api/launches/groups", listLaunchGroups);
router.patch("/api/launches/groups/:id", toggleGroupStatus);
router.post("/api/launches/participant-webhook", handleGroupParticipantWebhook);

// WhatsApp & Aquecedor Routes
router.get("/api/whatsapp/instances", listInstances);
router.post("/api/whatsapp/instances", createInstance);
router.patch("/api/whatsapp/instances/:instanceKey", toggleInstanceStatus);
router.get("/api/whatsapp/connect/:instanceKey?", connectInstance);
router.get("/api/whatsapp/chats", listChats);
router.post("/api/whatsapp/chats/send", sendChatMessage);
router.post("/api/whatsapp/sendgate/preview", previewSendGate);
router.get("/api/whatsapp/warming", getWarmingNetwork);
router.patch("/api/whatsapp/warming/pairs/:pairId", toggleWarmingPair);
router.post("/api/whatsapp/warming/pairs/:pairId/step", triggerWarmingStep);
router.get("/api/whatsapp/leadradar", searchLeadRadar);
router.post("/api/whatsapp/leadradar/import", importLeadRadar);

// CRM, Sales & Recovery Routes
router.get("/api/crm/leads", listLeads);
router.get("/api/crm/leads/:id/timeline", getLeadTimeline);
router.get("/api/crm/sales", listSales);
router.get("/api/crm/products", listProducts);
router.get("/api/crm/recovery", listRecovery);
router.patch("/api/crm/recovery/:id", updateRecoveryStatus);
router.post("/api/crm/import-csv", importCsv);
router.post("/api/crm/leads/import-csv", importCsv);

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


