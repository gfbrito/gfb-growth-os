/**
 * GFB Growth OS — CSV Streaming Importer & E.164 Normalization Engine
 * Suporta importação de grandes bases (50.000+ linhas) com auto-detecção de headers
 * (Kiwify, Hotmart, Eduzz, ActiveCampaign, etc.), sanitização E.164 e merge no Identity Graph.
 */

import { mockDb, MockLead, MockOrder } from "./mockDb.js";
import { identityService } from "./identityService.js";
import { eventBus } from "./eventBus.js";

export interface CsvImportRow {
  name?: string;
  email?: string;
  phone?: string;
  product?: string;
  amount?: number;
  date?: string;
  status?: string;
  raw?: Record<string, string>;
}

export interface CsvImportSummary {
  totalProcessed: number;
  createdCount: number;
  mergedCount: number;
  ordersCreatedCount: number;
  skippedCount: number;
  executionTimeMs: number;
  sampleLeads: Array<{ id: string; name: string; email: string; phone: string; isNew: boolean }>;
  detectedPlatform: "KIWIFY" | "HOTMART" | "EDUZZ" | "GENERIC";
}

export class CsvImporterService {
  /**
   * Sanitiza e normaliza rigorosamente para formato E.164 (+55 DDD 9XXXX-XXXX)
   */
  public sanitizeE164(phoneRaw: string): string {
    if (!phoneRaw) return "";
    let clean = phoneRaw.replace(/\D/g, "");
    if (!clean) return "";

    // Se já vier com código do Brasil (55)
    if (clean.startsWith("55")) {
      clean = clean.substring(2);
    }

    // Se tiver 10 dígitos (DDD + 8 dígitos) e for celular (início 6, 7, 8 ou 9), insere o dígito 9
    if (clean.length === 10) {
      const ddd = clean.substring(0, 2);
      const firstDigit = clean.charAt(2);
      if (["6", "7", "8", "9"].includes(firstDigit)) {
        clean = `${ddd}9${clean.substring(2)}`;
      }
    }

    // Valida se ficou com 11 dígitos (DDD + 9 dígitos)
    if (clean.length === 11) {
      return `+55${clean}`;
    }

    // Caso de telefone internacional já formatado ou número fixo (10 dígitos)
    if (clean.length >= 10 && clean.length <= 15) {
      return `+55${clean}`;
    }

    return "";
  }

  /**
   * Detecta o formato da plataforma a partir dos nomes das colunas
   */
  public detectPlatform(headers: string[]): "KIWIFY" | "HOTMART" | "EDUZZ" | "GENERIC" {
    const normalized = headers.map((h) => h.toLowerCase().trim());
    if (normalized.some((h) => h.includes("kiwify") || h.includes("valor líquido") || h.includes("nome do cliente"))) {
      return "KIWIFY";
    }
    if (normalized.some((h) => h.includes("hotmart") || h.includes("nome do comprador") || h.includes("preço da oferta"))) {
      return "HOTMART";
    }
    if (normalized.some((h) => h.includes("eduzz") || h.includes("trans_status") || h.includes("cliente celular"))) {
      return "EDUZZ";
    }
    return "GENERIC";
  }

  /**
   * Mapeia linha bruta para objeto tipado CsvImportRow com auto-resolução de colunas
   */
  public mapRow(row: Record<string, string>): CsvImportRow {
    const keys = Object.keys(row);
    const getVal = (candidates: string[]): string => {
      for (const cand of candidates) {
        const foundKey = keys.find((k) => k.toLowerCase().trim() === cand.toLowerCase().trim());
        if (foundKey && row[foundKey]) return row[foundKey].trim();
      }
      return "";
    };

    const name = getVal([
      "nome",
      "name",
      "nome do cliente",
      "nome do comprador",
      "cliente nome",
      "full_name",
      "primeiro nome",
    ]);

    const email = getVal([
      "email",
      "e-mail",
      "email do comprador",
      "cliente email",
      "mail",
    ]).toLowerCase();

    const rawPhone = getVal([
      "telefone",
      "celular",
      "phone",
      "whatsapp",
      "cliente celular",
      "telefone com ddd",
      "ddd + telefone",
      "mobile",
    ]);

    const product = getVal([
      "produto",
      "product",
      "nome do produto",
      "produto descrição",
      "curso",
      "oferta",
    ]);

    const amountRaw = getVal([
      "valor",
      "preco",
      "preço",
      "preço da oferta",
      "valor total",
      "valor líquido",
      "amount",
      "total",
    ]);

    let amount: number | undefined;
    if (amountRaw) {
      // Normaliza R$ 1.997,00 ou 1997.00
      const sanitizedNum = amountRaw.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
      const parsed = parseFloat(sanitizedNum);
      if (!isNaN(parsed)) amount = parsed;
    }

    const date = getVal([
      "data",
      "data da venda",
      "data da compra",
      "criado em",
      "created_at",
      "date",
    ]);

    const status = getVal(["status", "situacao", "situação", "status da transação", "trans_status"]);

    return {
      name,
      email,
      phone: this.sanitizeE164(rawPhone),
      product,
      amount,
      date: date || new Date().toISOString(),
      status,
      raw: row,
    };
  }

  /**
   * Processamento em Streaming / Lotes de alto desempenho (50k+ linhas)
   */
  public async processStreamBatch(
    rows: Array<Record<string, string>>,
    clientId: string = "cli_bruna_ppp"
  ): Promise<CsvImportSummary> {
    const startTime = Date.now();
    let createdCount = 0;
    let mergedCount = 0;
    let ordersCreatedCount = 0;
    let skippedCount = 0;
    const sampleLeads: Array<{ id: string; name: string; email: string; phone: string; isNew: boolean }> = [];

    if (rows.length === 0) {
      return {
        totalProcessed: 0,
        createdCount: 0,
        mergedCount: 0,
        ordersCreatedCount: 0,
        skippedCount: 0,
        executionTimeMs: 0,
        sampleLeads: [],
        detectedPlatform: "GENERIC",
      };
    }

    const headers = Object.keys(rows[0]);
    const detectedPlatform = this.detectPlatform(headers);

    // Processamento em chunks de 500 linhas para não bloquear o event loop
    const CHUNK_SIZE = 500;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);

      for (const rawRow of chunk) {
        const item = this.mapRow(rawRow);

        // Se não tem nem e-mail nem telefone válido, pula
        if (!item.email && !item.phone) {
          skippedCount++;
          continue;
        }

        // Verifica existência prévia
        const existingLead = mockDb.leads.find((l) => {
          const emailMatch = item.email && l.email.toLowerCase() === item.email.toLowerCase();
          const phoneMatch = item.phone && l.phone === item.phone;
          return emailMatch || phoneMatch;
        });

        const isNew = !existingLead;

        // Resolve ou cria através do Identity Graph
        const lead = identityService.resolveOrCreateLead({
          clientId,
          name: item.name,
          email: item.email,
          phone: item.phone,
          sourceTag: `Importação CSV (${detectedPlatform})`,
        });

        if (isNew) {
          createdCount++;
        } else {
          mergedCount++;
        }

        // Se houver dados de compra/produto na linha, cria o pedido
        if (item.product || item.amount) {
          const amountCents = item.amount ? BigInt(Math.round(item.amount * 100)) : BigInt(9700);
          mockDb.orders.unshift({
            id: `ord_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            clientId,
            leadName: lead.name,
            leadEmail: lead.email,
            productName: item.product || "Curso MTC Avançado",
            grossAmountCents: amountCents,
            status: "CONFIRMED",
            platform: detectedPlatform,
            isAttributedToAds: false,
            createdAt: item.date || new Date().toISOString(),
            capiStatus: "SENT",
          });
          ordersCreatedCount++;

          // Atualiza RFM e temperatura do Lead
          lead.temperature = "HOT";
          lead.stage = "BUYER";
          lead.purchaseCount += 1;
          lead.totalSpentCents += amountCents;
          lead.rfmPoints += 50;
        }

        // Amostra dos 5 primeiros leads para prévia visual no frontend
        if (sampleLeads.length < 5) {
          sampleLeads.push({
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            isNew,
          });
        }
      }

      // Pequena pausa assíncrona para liberar I/O se for base gigantesca
      if (rows.length > 5000) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    // Emite evento em tempo real via SSE
    eventBus.broadcast({
      type: "CSV_IMPORTED",
      payload: {
        clientId,
        totalProcessed: rows.length,
        createdCount,
        mergedCount,
        ordersCreatedCount,
        detectedPlatform,
      },
    });

    return {
      totalProcessed: rows.length,
      createdCount,
      mergedCount,
      ordersCreatedCount,
      skippedCount,
      executionTimeMs: Date.now() - startTime,
      sampleLeads,
      detectedPlatform,
    };
  }
}

export const csvImporterService = new CsvImporterService();
