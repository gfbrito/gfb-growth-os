import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

export interface EvolutionInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  qrcode?: {
    base64: string;
  };
}

export class EvolutionClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = (env.EVOLUTION_API_URL || "http://localhost:8080").replace(/\/$/, "");
    this.apiKey = env.EVOLUTION_API_KEY || "";
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      apikey: this.apiKey,
    };
  }

  /**
   * Create new Evolution API v2 instance
   */
  public async createInstance(instanceName: string): Promise<EvolutionInstanceResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/create`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          instanceName,
          token: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, errorText }, "Evolution API create instance error");
        return null;
      }

      return (await response.json()) as EvolutionInstanceResponse;
    } catch (err: any) {
      logger.error({ err: err.message, instanceName }, "Failed to call Evolution API createInstance");
      return null;
    }
  }

  /**
   * Connect and fetch QR Code for instance
   */
  public async connectInstance(instanceName: string): Promise<{ base64?: string; pairingCode?: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as { base64?: string; pairingCode?: string };
    } catch (err: any) {
      logger.error({ err: err.message, instanceName }, "Failed to fetch QR Code from Evolution API");
      return null;
    }
  }

  /**
   * Send plain text message
   */
  public async sendTextMessage(instanceName: string, number: string, text: string): Promise<any> {
    const cleanNumber = number.replace(/\D/g, "");

    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: cleanNumber,
          options: {
            delay: 1200,
            presence: "composing",
          },
          text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Evolution API sendText failed: ${error}`);
      }

      return await response.json();
    } catch (err: any) {
      logger.error({ err: err.message, instanceName, number }, "Error sending text message");
      throw err;
    }
  }

  /**
   * Send media message (image, audio, document)
   */
  public async sendMediaMessage(
    instanceName: string,
    number: string,
    mediaUrl: string,
    caption?: string,
    mediaType: "image" | "audio" | "document" = "image"
  ): Promise<any> {
    const cleanNumber = number.replace(/\D/g, "");

    try {
      const response = await fetch(`${this.baseUrl}/message/sendMedia/${instanceName}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: cleanNumber,
          options: {
            delay: 2000,
            presence: mediaType === "audio" ? "recording" : "composing",
          },
          mediaMessage: {
            mediatype: mediaType,
            caption: caption || "",
            media: mediaUrl,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Evolution API sendMedia failed: ${error}`);
      }

      return await response.json();
    } catch (err: any) {
      logger.error({ err: err.message, instanceName, number }, "Error sending media message");
      throw err;
    }
  }
}

export const evolutionClient = new EvolutionClient();
