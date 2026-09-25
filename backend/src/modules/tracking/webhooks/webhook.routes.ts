import { Router } from "express";
import { handleKiwifyWebhook } from "./webhook.controller.js";

const router = Router();

// Payment Webhooks
router.post("/api/webhook/kiwify/:pixel_key", handleKiwifyWebhook);

export const webhookRoutes = router;
