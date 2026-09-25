import { Router } from "express";
import { getAgencyDashboard, getClientDashboard } from "../modules/dashboard/dashboard.controller.js";
import { listTasks, createTask, updateTaskStatus, deleteTask } from "../modules/tasks/task.controller.js";
import { listLaunches, listLaunchGroups, toggleGroupStatus, handleLaunchRedirect } from "../modules/launches/launch.controller.js";
import { listInstances, connectInstance, listChats, sendChatMessage } from "../modules/whatsapp/whatsapp.controller.js";
import { listLeads, listSales, listProducts, listRecovery, updateRecoveryStatus, importCsv } from "../modules/crm/crm.controller.js";
import { listMediaJobs, createCaptionJob } from "../modules/media/media.controller.js";
import {
  handleKiwifyWebhook,
  handleHotmartWebhook,
  handleEduzzWebhook,
  simulateWebhook,
  getLeadTimeline,
} from "../modules/webhooks/webhook.controller.js";

const router = Router();

// Public Launch Redirection (SendFlow style)
router.get("/l/:slug", handleLaunchRedirect);

// Dashboard Routes
router.get("/api/dashboard/agency", getAgencyDashboard);
router.get("/api/dashboard/client/:clientId?", getClientDashboard);

// Tasks Routes (ClickUp style)
router.get("/api/tasks", listTasks);
router.post("/api/tasks", createTask);
router.patch("/api/tasks/:id", updateTaskStatus);
router.delete("/api/tasks/:id", deleteTask);

// Launches & Groups Routes (SendFlow style)
router.get("/api/launches", listLaunches);
router.get("/api/launches/groups", listLaunchGroups);
router.patch("/api/launches/groups/:id", toggleGroupStatus);

// WhatsApp & Aquecedor Routes
router.get("/api/whatsapp/instances", listInstances);
router.get("/api/whatsapp/connect/:instanceKey?", connectInstance);
router.get("/api/whatsapp/chats", listChats);
router.post("/api/whatsapp/chats/send", sendChatMessage);

// CRM, Sales & Recovery Routes
router.get("/api/crm/leads", listLeads);
router.get("/api/crm/leads/:id/timeline", getLeadTimeline);
router.get("/api/crm/sales", listSales);
router.get("/api/crm/products", listProducts);
router.get("/api/crm/recovery", listRecovery);
router.patch("/api/crm/recovery/:id", updateRecoveryStatus);
router.post("/api/crm/import-csv", importCsv);

// Payment & Checkout Webhooks (Identity Graph & CAPI)
router.post("/api/webhooks/kiwify", handleKiwifyWebhook);
router.post("/api/webhooks/hotmart", handleHotmartWebhook);
router.post("/api/webhooks/eduzz", handleEduzzWebhook);
router.post("/api/webhooks/simulate", simulateWebhook);

// Media & Video AI Routes
router.get("/api/media/jobs", listMediaJobs);
router.post("/api/media/caption", createCaptionJob);

export const apiRoutes = router;

