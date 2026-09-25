import { logger } from "../../utils/logger.js";
import { prisma } from "../../services/prisma.js";

export interface SendMessageOptions {
  instanceId: string;
  targetPhone: string;
  messageType: "TEXT" | "IMAGE" | "AUDIO";
  content: string;
  mediaUrl?: string;
  isWarming?: boolean;
}

export class SendGate {
  private static instance: SendGate;

  // Track message counters in memory per instance for coffee breaks
  private consecutiveMessagesCount: Map<string, number> = new Map();
  private lastSendTimestamp: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): SendGate {
    if (!SendGate.instance) {
      SendGate.instance = new SendGate();
    }
    return SendGate.instance;
  }

  /**
   * Calculates dynamic gaussian anti-ban delay (1.5s base + jitter)
   */
  public calculateHumanJitter(): number {
    const baseMs = 1500;
    // Box-Muller transform for gaussian distribution
    const u = Math.random();
    const v = Math.random();
    const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const jitterMs = Math.max(500, Math.min(3500, Math.round(1500 + normal * 500)));
    return baseMs + jitterMs;
  }

  /**
   * Checks if instance is eligible to send (daily cap, quarantine, cooldown)
   */
  public async canSend(instanceId: string): Promise<{ allowed: boolean; reason?: string }> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
      select: {
        id: true,
        status: true,
        dailySendCap: true,
        sentTodayCount: true,
        banRiskScore: true,
      },
    });

    if (!instance) {
      return { allowed: false, reason: "INSTANCE_NOT_FOUND" };
    }

    if (instance.status === "QUARANTINED") {
      return { allowed: false, reason: "INSTANCE_QUARANTINED" };
    }

    if (instance.status !== "CONNECTED") {
      return { allowed: false, reason: "INSTANCE_NOT_CONNECTED" };
    }

    if (instance.banRiskScore > 70) {
      // Auto-quarantine if risk score exceeds safety threshold
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { status: "QUARANTINED" },
      });
      logger.error({ instanceId, banRiskScore: instance.banRiskScore }, "Instance automatically quarantined due to high ban risk");
      return { allowed: false, reason: "HIGH_BAN_RISK_QUARANTINE" };
    }

    if (instance.sentTodayCount >= instance.dailySendCap) {
      return { allowed: false, reason: "DAILY_SEND_CAP_REACHED" };
    }

    return { allowed: true };
  }

  /**
   * Enforces pacing, throttle and coffee-breaks before dispatching
   */
  public async executeSendPacing(instanceId: string): Promise<void> {
    const lastSend = this.lastSendTimestamp.get(instanceId) || 0;
    const now = Date.now();
    const timeSinceLast = now - lastSend;
    const requiredDelay = this.calculateHumanJitter();

    if (timeSinceLast < requiredDelay) {
      const waitMs = requiredDelay - timeSinceLast;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    // Check Coffee Break: Every 25 consecutive messages, pause for 20-40 seconds
    const count = (this.consecutiveMessagesCount.get(instanceId) || 0) + 1;
    if (count >= 25) {
      const coffeeBreakMs = 20000 + Math.floor(Math.random() * 20000);
      logger.info({ instanceId, coffeeBreakMs }, "SendGate: Triggering anti-ban coffee break");
      this.consecutiveMessagesCount.set(instanceId, 0);
      await new Promise((resolve) => setTimeout(resolve, coffeeBreakMs));
    } else {
      this.consecutiveMessagesCount.set(instanceId, count);
    }

    this.lastSendTimestamp.set(instanceId, Date.now());

    // Increment sent count in DB
    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: {
        sentTodayCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
  }
}

export const sendGate = SendGate.getInstance();
