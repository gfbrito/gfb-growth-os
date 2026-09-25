import { Request, Response } from "express";
import { mockDb } from "../../services/mockDb.js";

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
