import { Request, Response } from "express";
import { prisma } from "../../services/prisma.js";
import { mockDb } from "../../services/mockDb.js";
import { generateSnippet } from "./snippet/snippetBuilder.js";
import { metaCapiService } from "./capi/metaCapiService.js";
import { logger } from "../../utils/logger.js";

/**
 * Serves dynamic JavaScript tracking snippet /s/:pixel_key.js
 */
export async function serveSnippet(req: Request, res: Response): Promise<void> {
  const pixelKey = String(req.params.pixel_key);

  try {
    let pixel: { pixelId: string; pixelKey: string; isActive: boolean } | null = null;

    try {
      pixel = await prisma.clientPixel.findUnique({
        where: { pixelKey },
        select: { pixelId: true, pixelKey: true, isActive: true },
      });
    } catch (dbErr) {
      // Graceful fallback to mockDb when local Postgres is not running
      const mockClient = mockDb.clients.find((c) => c.pixelKey === pixelKey);
      if (mockClient) {
        pixel = {
          pixelId: mockClient.pixelId,
          pixelKey: mockClient.pixelKey,
          isActive: true,
        };
      }
    }

    if (!pixel || !pixel.isActive) {
      res.status(404).type("text/javascript").send("/* GFB Pixel not found or inactive */");
      return;
    }

    const script = generateSnippet(pixel.pixelKey, pixel.pixelId);

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache 1 hour
    res.send(script);
  } catch (err: any) {
    logger.error({ pixelKey, err: err.message }, "Error serving CAPI snippet");
    res.status(500).type("text/javascript").send("/* Snippet generation error */");
  }
}

/**
 * Ingests browser events from the snippet (POST /api/events)
 */
export async function receiveEvent(req: Request, res: Response): Promise<void> {
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  const {
    pixelKey,
    eventName,
    eventId,
    url,
    referrer,
    fbp,
    fbc,
    capiIdx,
    externalId,
    customData,
    userData,
  } = req.body;

  if (!pixelKey || !eventName || !eventId) {
    res.status(400).json({ error: "Missing required tracking parameters" });
    return;
  }

  // Respond 200 immediately to avoid blocking browser
  res.status(200).json({ success: true, eventId });

  // Asynchronous event processing
  try {
    const pixel = await prisma.clientPixel.findUnique({
      where: { pixelKey },
      select: {
        id: true,
        pixelId: true,
        capiToken: true,
        testCode: true,
        client: {
          select: { id: true },
        },
      },
    });

    if (!pixel) {
      logger.warn({ pixelKey, eventId }, "Dropped event: Pixel not found");
      return;
    }

    // 1. Record raw event in database
    await prisma.eventRaw.create({
      data: {
        pixelKey,
        eventName,
        eventId,
        eventSource: "website",
        url,
        referrer,
        fbp,
        fbc,
        capiUid: capiIdx,
        externalId,
        ipAddress,
        userAgent,
        customData: customData || {},
        userData: userData || {},
        capiStatus: "PENDING",
      },
    });

    // 2. Dispatch to Meta Conversions API (server-side)
    try {
      const response = await metaCapiService.sendEventsBatch(
        pixel.pixelId,
        pixel.capiToken,
        [
          {
            eventName,
            eventId,
            eventSourceUrl: url,
            actionSource: "website",
            userData: {
              email: userData?.email,
              phone: userData?.phone,
              fbp,
              fbc,
              ipAddress,
              userAgent,
              externalId,
            },
            customData,
          },
        ],
        pixel.testCode || undefined
      );

      if (response) {
        await prisma.eventRaw.updateMany({
          where: { eventId, pixelKey },
          data: {
            capiStatus: "SENT",
            fbTraceId: response.fbtrace_id,
            capiResponse: response as any,
          },
        });
      }
    } catch (capiErr: any) {
      await prisma.eventRaw.updateMany({
        where: { eventId, pixelKey },
        data: {
          capiStatus: "FAILED",
          capiResponse: { error: capiErr.message },
        },
      });
    }
  } catch (err: any) {
    logger.error({ err: err.message, eventId, pixelKey }, "Background event storage error");
  }
}

/**
 * Ingests checkout intent token from landing page (POST /api/checkout-intent)
 */
export async function receiveCheckoutIntent(req: Request, res: Response): Promise<void> {
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  const { capiIdx, pixelKey, fbp, fbc, externalId, landingUrl, checkoutUrl } = req.body;

  if (!capiIdx || !pixelKey) {
    res.status(400).json({ error: "Missing capiIdx or pixelKey" });
    return;
  }

  res.status(200).json({ success: true, capiIdx });

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.checkoutIntent.upsert({
      where: { capiIdx },
      update: {
        fbp: fbp || undefined,
        fbc: fbc || undefined,
        externalId: externalId || undefined,
        checkoutUrl: checkoutUrl || undefined,
      },
      create: {
        capiIdx,
        pixelKey,
        fbp,
        fbc,
        externalId,
        ipAddress,
        userAgent,
        landingUrl,
        checkoutUrl,
        expiresAt,
      },
    });

    logger.debug({ capiIdx, pixelKey }, "Checkout intent recorded");
  } catch (err: any) {
    logger.error({ err: err.message, capiIdx }, "Failed to record checkout intent");
  }
}
