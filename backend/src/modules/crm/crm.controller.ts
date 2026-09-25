import { Request, Response } from "express";
import { mockDb } from "../../services/mockDb.js";
import { csvImporterService } from "../../services/csvImporterService.js";

export async function listLeads(req: Request, res: Response): Promise<void> {
  const { temperature, stage, clientId } = req.query;

  let leads = [...mockDb.leads];

  if (clientId) {
    leads = leads.filter((l) => l.clientId === clientId);
  }
  if (temperature) {
    leads = leads.filter((l) => l.temperature === temperature);
  }
  if (stage) {
    leads = leads.filter((l) => l.stage === stage);
  }

  const enriched = leads.map((l) => ({
    ...l,
    totalSpent: Number(l.totalSpentCents) / 100,
  }));

  res.json({ leads: enriched });
}

export async function listSales(req: Request, res: Response): Promise<void> {
  const { clientId, status } = req.query;

  let orders = [...mockDb.orders];

  if (clientId) {
    orders = orders.filter((o) => o.clientId === clientId);
  }
  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  const enriched = orders.map((o) => ({
    ...o,
    grossAmount: Number(o.grossAmountCents) / 100,
  }));

  res.json({ sales: enriched });
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const { clientId } = req.query;
  let products = [...mockDb.products];
  if (clientId) {
    products = products.filter((p) => p.clientId === clientId);
  }
  const enriched = products.map((p) => ({
    ...p,
    price: Number(p.priceCents) / 100,
  }));
  res.json({ products: enriched });
}

export async function listRecovery(req: Request, res: Response): Promise<void> {
  const { clientId, type, status } = req.query;
  let items = [...mockDb.recoveryItems];
  if (clientId) {
    items = items.filter((i) => i.clientId === clientId);
  }
  if (type) {
    items = items.filter((i) => i.type === type);
  }
  if (status) {
    items = items.filter((i) => i.status === status);
  }

  const enriched = items.map((i) => ({
    ...i,
    amount: Number(i.amountCents) / 100,
  }));

  const totalRetainedCents = items.reduce((acc, curr) => acc + curr.amountCents, BigInt(0));

  res.json({
    recoveryItems: enriched,
    totalCount: items.length,
    totalPotential: Number(totalRetainedCents) / 100,
  });
}

export async function updateRecoveryStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  const item = mockDb.recoveryItems.find((i) => i.id === id);
  if (!item) {
    res.status(404).json({ error: "Item de recuperação não encontrado" });
    return;
  }

  if (status) {
    item.status = status;
  }

  res.json({ success: true, item: { ...item, amount: Number(item.amountCents) / 100 } });
}

export async function importCsv(req: Request, res: Response): Promise<void> {
  try {
    const { rows, clientId } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: "Nenhuma linha enviada para importação" });
      return;
    }

    const summary = await csvImporterService.processStreamBatch(rows, clientId as string || "cli_bruna_ppp");
    res.json({ success: true, ...summary });
  } catch (err: any) {
    res.status(500).json({ error: "Falha na importação do CSV", message: err.message });
  }
}

