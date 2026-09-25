import { Request, Response } from "express";
import { prisma } from "../../../services/prisma.js";
import { logger } from "../../../utils/logger.js";
import { metaCapiService } from "../capi/metaCapiService.js";
import { sha256, normalizeEmail, normalizePhoneBR } from "../normalize.js";
import { OrderStatus, RecoveryStatus, RecoveryType } from "@prisma/client";

/**
 * Normalizes payment platform status into system standard OrderStatus
 */
function normalizeOrderStatus(rawStatus: string): OrderStatus {
  const s = rawStatus.toLowerCase().trim();

  if (["paid", "approved", "completo", "aprovado", "compra_aprovada"].includes(s)) {
    return OrderStatus.CONFIRMED;
  }
  if (["waiting_payment", "pending", "aguardando_pagamento", "boleto_impresso", "pix_gerado"].includes(s)) {
    return OrderStatus.PENDING;
  }
  if (["refunded", "reembolsado", "reembolso"].includes(s)) {
    return OrderStatus.REFUNDED;
  }
  if (["chargedback", "chargeback", "dispute", "contestacao"].includes(s)) {
    return OrderStatus.CHARGEBACK;
  }
  return OrderStatus.CANCELED;
}

/**
 * Kiwify Webhook Handler
 */
export async function handleKiwifyWebhook(req: Request, res: Response): Promise<void> {
  const pixelKey = String(req.params.pixel_key);
  const payload = req.body;

  // Always respond 200 fast to acknowledge webhook receipt
  res.status(200).json({ received: true });

  if (!payload || !payload.order_id) {
    logger.warn({ pixelKey }, "Received empty or invalid Kiwify webhook");
    return;
  }

  const orderId = String(payload.order_id);
  const orderStatus = normalizeOrderStatus(payload.order_status || payload.status || "");
  const grossAmountCents = BigInt(Math.round((payload.order_ref_amount || payload.amount || 0) * 100));

  const customer = payload.Customer || payload.customer || {};
  const email = normalizeEmail(customer.email);
  const phone = normalizePhoneBR(customer.mobile || customer.phone);
  const name = customer.full_name || customer.name || null;

  // Extract tracking parameters passed in checkout URL (s2 carries capi_idx, s3 carries external_id)
  const trackingParams = payload.TrackingParameters || payload.tracking_parameters || {};
  const capiIdx = trackingParams.s2 || trackingParams.src || trackingParams.capi_idx || null;
  const externalId = trackingParams.s3 || customer.external_id || null;

  logger.info(
    { pixelKey, orderId, orderStatus, email, capiIdx },
    "Processing Kiwify purchase webhook"
  );

  try {
    const pixel = await prisma.clientPixel.findUnique({
      where: { pixelKey },
      include: { client: true },
    });

    if (!pixel) {
      logger.error({ pixelKey }, "Client pixel not found for Kiwify webhook");
      return;
    }

    const clientId = pixel.clientId;

    // Use Prisma transaction with advisory lock on email to protect against Order Bump race conditions
    await prisma.$transaction(async (tx) => {
      // 1. Transactional lock on email hash
      if (email) {
        await tx.$queryRawUnsafe(
          `SELECT pg_advisory_xact_lock(hashtext('lead_lock_' || lower(trim($1))))`,
          email
        );
      }

      // 2. Lookup existing checkout intent to recover fbp and fbc
      let fbp: string | null = null;
      let fbc: string | null = null;
      let resolvedExternalId: string | null = externalId;

      if (capiIdx) {
        const intent = await tx.checkoutIntent.findUnique({
          where: { capiIdx },
        });

        if (intent) {
          fbp = intent.fbp;
          fbc = intent.fbc;
          resolvedExternalId = resolvedExternalId || intent.externalId;

          await tx.checkoutIntent.update({
            where: { capiIdx },
            data: { isConverted: true },
          });
        }
      }

      // 3. Find or Create Lead
      let lead = await tx.lead.findFirst({
        where: {
          clientId,
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phoneE164: phone }] : []),
          ],
        },
      });

      if (!lead) {
        lead = await tx.lead.create({
          data: {
            clientId,
            name,
            email,
            emailHash: email ? sha256(email) : null,
            phoneE164: phone,
            phoneHash: phone ? sha256(phone) : null,
            temperature: "HOT",
            stage: orderStatus === OrderStatus.CONFIRMED ? "BUYER" : "LEAD",
            totalSpentCents: orderStatus === OrderStatus.CONFIRMED ? grossAmountCents : BigInt(0),
            purchaseCount: orderStatus === OrderStatus.CONFIRMED ? 1 : 0,
            rfmPoints: orderStatus === OrderStatus.CONFIRMED ? 50 : 10,
          },
        });
      } else if (orderStatus === OrderStatus.CONFIRMED) {
        // Increment buyer stats
        lead = await tx.lead.update({
          where: { id: lead.id },
          data: {
            name: name || lead.name,
            temperature: "HOT",
            stage: lead.purchaseCount >= 1 ? "RECURRING" : "BUYER",
            totalSpentCents: { increment: grossAmountCents },
            purchaseCount: { increment: 1 },
            rfmPoints: { increment: 50 },
            lastSeenAt: new Date(),
          },
        });
      }

      // 4. Save Lead Identity if fbc or fbp exists
      if (lead && (fbc || fbp || resolvedExternalId)) {
        await tx.leadIdentity.create({
          data: {
            leadId: lead.id,
            fbp,
            fbc,
            capiUid: capiIdx,
            source: "CHECKOUT",
          },
        });
      }

      // 5. Handle Recoveries
      if (orderStatus === OrderStatus.CONFIRMED) {
        // Automatically close open recoveries for this lead
        await tx.recovery.updateMany({
          where: {
            leadId: lead.id,
            status: { in: [RecoveryStatus.PENDING, RecoveryStatus.IN_PROGRESS] },
          },
          data: {
            status: RecoveryStatus.RECOVERED_BY_SALE,
            resolvedAt: new Date(),
          },
        });
      } else if (orderStatus === OrderStatus.PENDING) {
        // Open Recovery opportunity
        const paymentMethod = payload.payment_method || "pix";
        const recoveryType =
          paymentMethod === "boleto" ? RecoveryType.BOLETO_PENDING : RecoveryType.PIX_PENDING;

        await tx.recovery.create({
          data: {
            clientId,
            leadId: lead.id,
            type: recoveryType,
            status: RecoveryStatus.PENDING,
            amountCents: grossAmountCents,
            checkoutUrl: payload.boleto_url || payload.pix_code_url || null,
            pixCode: payload.pix_code || null,
          },
        });
      }

      // 6. Record or Update Order
      const order = await tx.order.upsert({
        where: {
          clientId_platform_platformOrderId: {
            clientId,
            platform: "KIWIFY",
            platformOrderId: orderId,
          },
        },
        update: {
          status: orderStatus,
          grossAmountCents,
        },
        create: {
          clientId,
          leadId: lead.id,
          platform: "KIWIFY",
          platformOrderId: orderId,
          status: orderStatus,
          grossAmountCents,
          netAmountCents: grossAmountCents, // can be updated when fee is known
          paymentMethod: payload.payment_method || null,
          capiIdxMatched: capiIdx,
          isAttributedToAds: !!(fbc || trackingParams.utm_source),
          adCampaignId: trackingParams.utm_campaign || null,
        },
      });

      // 7. Dispatch Meta CAPI Purchase Event if confirmed
      if (orderStatus === OrderStatus.CONFIRMED && pixel.capiToken) {
        const eventId = `pur_kiwi_${orderId}`;

        try {
          const capiResponse = await metaCapiService.sendEventsBatch(
            pixel.pixelId,
            pixel.capiToken,
            [
              {
                eventName: "Purchase",
                eventId,
                actionSource: "website",
                userData: {
                  email,
                  phone,
                  name,
                  fbp,
                  fbc,
                  externalId: resolvedExternalId,
                },
                customData: {
                  currency: "BRL",
                  value: Number(grossAmountCents) / 100,
                  order_id: orderId,
                },
              },
            ],
            pixel.testCode || undefined
          );

          if (capiResponse) {
            await tx.order.update({
              where: { id: order.id },
              data: {
                capiStatus: "SENT",
                capiFbTraceId: capiResponse.fbtrace_id,
              },
            });
          }
        } catch (err: any) {
          logger.error({ err: err.message, orderId }, "Failed to send CAPI Purchase event");
          await tx.order.update({
            where: { id: order.id },
            data: { capiStatus: "FAILED" },
          });
        }
      }
    });

    logger.info({ orderId, orderStatus }, "Kiwify webhook processed successfully");
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, "Error processing Kiwify webhook");
  }
}
