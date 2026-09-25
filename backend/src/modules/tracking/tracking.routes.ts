import { Router } from "express";
import {
  serveSnippet,
  receiveEvent,
  receiveCheckoutIntent,
} from "./tracking.controller.js";

const router = Router();

// Public Snippet Route
router.get("/s/:pixel_key.js", serveSnippet);

// Public Tracking Ingestion Routes
router.post("/api/events", receiveEvent);
router.post("/api/checkout-intent", receiveCheckoutIntent);

export const trackingRoutes = router;
