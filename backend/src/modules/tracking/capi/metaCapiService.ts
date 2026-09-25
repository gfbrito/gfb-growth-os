import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";
import { metaCircuitBreaker } from "./circuitBreaker.js";
import { buildMetaUserData } from "../normalize.js";

export interface MetaCapiEventInput {
  eventName: string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: "website" | "app" | "physical_store" | "system_generated" | "other";
  userData: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    fbp?: string | null;
    fbc?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    externalId?: string | null;
  };
  customData?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    order_id?: string;
    [key: string]: any;
  };
}

export interface MetaCapiBatchResponse {
  events_received: number;
  messages: any[];
  fbtrace_id: string;
}

export class MetaCapiService {
  /**
   * Dispatches a batch of events to Meta Conversions API (Graph API)
   */
  public async sendEventsBatch(
    pixelId: string,
    accessToken: string,
    events: MetaCapiEventInput[],
    testEventCode?: string
  ): Promise<MetaCapiBatchResponse | null> {
    if (!metaCircuitBreaker.canExecute()) {
      logger.warn({ pixelId, eventCount: events.length }, "CAPI Batch skipped: Circuit breaker is OPEN");
      return null;
    }

    const version = env.META_GRAPH_API_VERSION;
    const url = `https://graph.facebook.com/${version}/${pixelId}/events`;

    const formattedEvents = events.map((ev) => ({
      event_name: ev.eventName,
      event_time: ev.eventTime || Math.floor(Date.now() / 1000),
      event_id: ev.eventId,
      event_source_url: ev.eventSourceUrl,
      action_source: ev.actionSource || "website",
      user_data: buildMetaUserData(ev.userData),
      custom_data: ev.customData,
    }));

    const payload: any = {
      data: formattedEvents,
      access_token: accessToken,
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();

      if (!response.ok) {
        metaCircuitBreaker.recordFailure(data);
        logger.error(
          {
            pixelId,
            status: response.status,
            error: data.error,
            fbtrace_id: data.error?.fbtrace_id,
          },
          "Meta Conversions API Batch Dispatch Failed"
        );
        throw new Error(data.error?.message || "Meta API error");
      }

      metaCircuitBreaker.recordSuccess();

      logger.info(
        {
          pixelId,
          eventsReceived: data.events_received,
          fbtrace_id: data.fbtrace_id,
        },
        "Meta Conversions API Batch Dispatched Successfully"
      );

      return data as MetaCapiBatchResponse;
    } catch (err: any) {
      metaCircuitBreaker.recordFailure(err);
      throw err;
    }
  }
}

export const metaCapiService = new MetaCapiService();
