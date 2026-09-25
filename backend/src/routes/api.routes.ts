import { Router } from "express";
import { getAgencyDashboard, getClientDashboard } from "../modules/dashboard/dashboard.controller.js";
import { listTasks, createTask, updateTaskStatus, deleteTask } from "../modules/tasks/task.controller.js";
import { listLaunches, handleLaunchRedirect } from "../modules/launches/launch.controller.js";
import { listInstances, connectInstance } from "../modules/whatsapp/whatsapp.controller.js";
import { listLeads, listSales } from "../modules/crm/crm.controller.js";
import { listMediaJobs, createCaptionJob } from "../modules/media/media.controller.js";

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

// Launches Routes (SendFlow style)
router.get("/api/launches", listLaunches);

// WhatsApp & Aquecedor Routes
router.get("/api/whatsapp/instances", listInstances);
router.get("/api/whatsapp/connect/:instanceKey?", connectInstance);

// CRM & Sales Routes
router.get("/api/crm/leads", listLeads);
router.get("/api/crm/sales", listSales);

// Media & Video AI Routes
router.get("/api/media/jobs", listMediaJobs);
router.post("/api/media/caption", createCaptionJob);

export const apiRoutes = router;
