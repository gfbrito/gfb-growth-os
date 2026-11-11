import { Router, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();

// In-memory mock store for clients (replace with Prisma when DB is live)
interface ClientRecord {
  id: string;
  organizationId: string;
  name: string;
  tradeName?: string;
  slug: string;
  documentType: "CPF" | "CNPJ";
  document?: string;
  contactName?: string;
  contactRole?: string;
  whatsapp?: string;
  email?: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  segment?: string;
  website?: string;
  instagramHandle?: string;
  businessType: string;
  status: string;
  managerId?: string;
  origin?: string;
  relationshipStartDate?: string;
  contractTotalCents: number;
  billingType: string;
  billingDueDay: number;
  paymentMethod: string;
  billingEmail?: string;
  billingNotes?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractDurationMonths?: number;
  autoRenew: boolean;
  adjustmentIndex?: string;
  adjustmentDate?: string;
  contractFileUrl?: string;
  contractSignatureStatus: string;
  cancellationReason?: string;
  adBudgetCents: number;
  adBudgetPayer: string;
  metaToken?: string;
  metaTokenValid: boolean;
  metaBusinessId?: string;
  metaPageId?: string;
  metaPageName?: string;
  metaIgAccountId?: string;
  selectedAdAccountIds?: string[];
  selectedAdAccounts?: Array<{
    id: string;
    accountId: string;
    name: string;
    currency?: string;
    accountStatus?: number;
  }>;
  selectedInstagramIds?: string[];
  selectedInstagramAccounts?: Array<{
    id: string;
    username: string;
    name?: string;
    pageName?: string;
    profilePictureUrl?: string;
  }>;
  mainObjective?: string;
  monthlyLeadsGoal?: number;
  targetCplCents?: number;
  targetRoas?: number;
  monthlyRevenueGoalCents: number;
  ltvCents?: number;
  reportFrequency: string;
  reportChannel: string;
  internalNotes?: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    negotiatedPriceCents: number;
    startDate: string;
    isActive: boolean;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENTS_FILE = path.resolve(__dirname, "../../../data/clients.json");

function loadClients(): ClientRecord[] {
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      const data = fs.readFileSync(CLIENTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro ao carregar clients.json:", err);
  }
  return [];
}

function saveClients(clients: ClientRecord[]) {
  try {
    const dir = path.dirname(CLIENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar clients.json:", err);
  }
}

const clientsStore: ClientRecord[] = loadClients();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateId(): string {
  return `cli_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// GET /api/clients — List all clients for current org
router.get("/api/clients", (req: Request, res: Response) => {
  const orgId = (req as any).user?.organizationId || "org_gfb_digital";
  const isAgency =
    (req as any).user?.growthRole === "MASTER_AGENCY" ||
    (req as any).user?.role === "SUPER_ADMIN" ||
    (req as any).user?.role === "OWNER" ||
    orgId === "org_gfb_digital";

  const filtered = isAgency
    ? clientsStore
    : clientsStore.filter((c) => c.organizationId === orgId);

  res.json({
    clients: filtered.map((c) => ({
      id: c.id,
      name: c.name,
      tradeName: c.tradeName,
      slug: c.slug,
      document: c.document,
      documentType: c.documentType,
      status: c.status,
      segment: c.segment,
      whatsapp: c.whatsapp,
      email: c.email,
      managerId: c.managerId,
      origin: c.origin,
      contractTotalCents: c.contractTotalCents,
      billingType: c.billingType,
      adBudgetCents: c.adBudgetCents,
      metaTokenValid: c.metaTokenValid,
      selectedAdAccountsCount: c.selectedAdAccountIds?.length || 0,
      selectedInstagramCount: c.selectedInstagramIds?.length || 0,
      isActive: c.isActive,
      createdAt: c.createdAt,
    })),
    total: filtered.length,
  });
});

// GET /api/clients/:id — Get single client full details
router.get("/api/clients/:id", (req: Request, res: Response) => {
  const client = clientsStore.find((c) => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }
  // Mask meta token — never expose to frontend
  const { ...safe } = client;
  res.json({ client: safe });
});

// POST /api/clients — Create new client
router.post("/api/clients", (req: Request, res: Response) => {
  const orgId = (req as any).user?.organizationId || "org_default";
  const body = req.body;

  if (!body.name || !body.name.trim()) {
    return res.status(400).json({ error: "Nome do cliente é obrigatório" });
  }

  const slug = generateSlug(body.name);
  const existing = clientsStore.find(
    (c) => c.organizationId === orgId && c.slug === slug
  );
  if (existing) {
    return res
      .status(409)
      .json({ error: "Já existe um cliente com esse nome nesta organização" });
  }

  const now = new Date().toISOString();
  const newClient: ClientRecord = {
    id: generateId(),
    organizationId: orgId,
    name: body.name.trim(),
    tradeName: body.tradeName || undefined,
    slug,
    documentType: body.documentType || "CPF",
    document: body.document || undefined,
    contactName: body.contactName || undefined,
    contactRole: body.contactRole || undefined,
    whatsapp: body.whatsapp || undefined,
    email: body.email || undefined,
    phone: body.phone || undefined,
    addressStreet: body.addressStreet || undefined,
    addressNumber: body.addressNumber || undefined,
    addressComplement: body.addressComplement || undefined,
    addressNeighborhood: body.addressNeighborhood || undefined,
    addressCity: body.addressCity || undefined,
    addressState: body.addressState || undefined,
    addressZip: body.addressZip || undefined,
    segment: body.segment || undefined,
    website: body.website || undefined,
    instagramHandle: body.instagramHandle || undefined,
    businessType: body.businessType || "INFOPRODUTOR",
    status: body.status || "ONBOARDING",
    managerId: body.managerId || undefined,
    origin: body.origin || undefined,
    relationshipStartDate: body.relationshipStartDate || undefined,
    contractTotalCents: body.contractTotalCents || 0,
    billingType: body.billingType || "MENSAL",
    billingDueDay: body.billingDueDay || 10,
    paymentMethod: body.paymentMethod || "PIX",
    billingEmail: body.billingEmail || undefined,
    billingNotes: body.billingNotes || undefined,
    contractStartDate: body.contractStartDate || undefined,
    contractEndDate: body.contractEndDate || undefined,
    contractDurationMonths: body.contractDurationMonths || undefined,
    autoRenew: body.autoRenew !== undefined ? body.autoRenew : true,
    adjustmentIndex: body.adjustmentIndex || undefined,
    adjustmentDate: body.adjustmentDate || undefined,
    contractFileUrl: body.contractFileUrl || undefined,
    contractSignatureStatus: body.contractSignatureStatus || "RASCUNHO",
    cancellationReason: body.cancellationReason || undefined,
    adBudgetCents: body.adBudgetCents || 0,
    adBudgetPayer: body.adBudgetPayer || "CLIENTE",
    metaToken: body.metaToken || undefined,
    metaTokenValid: body.metaTokenValid !== undefined ? body.metaTokenValid : !!body.metaToken,
    metaBusinessId: body.metaBusinessId || undefined,
    metaPageId: body.metaPageId || undefined,
    metaPageName: body.metaPageName || undefined,
    metaIgAccountId: body.metaIgAccountId || undefined,
    selectedAdAccountIds: body.selectedAdAccountIds || [],
    selectedAdAccounts: body.selectedAdAccounts || [],
    selectedInstagramIds: body.selectedInstagramIds || [],
    selectedInstagramAccounts: body.selectedInstagramAccounts || [],
    mainObjective: body.mainObjective || undefined,
    monthlyLeadsGoal: body.monthlyLeadsGoal || undefined,
    targetCplCents: body.targetCplCents || undefined,
    targetRoas: body.targetRoas || undefined,
    monthlyRevenueGoalCents: body.monthlyRevenueGoalCents || 0,
    ltvCents: body.ltvCents || undefined,
    reportFrequency: body.reportFrequency || "MENSAL",
    reportChannel: body.reportChannel || "WHATSAPP",
    internalNotes: body.internalNotes || undefined,
    services: body.services || [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  clientsStore.push(newClient);
  saveClients(clientsStore);

  res.status(201).json({
    client: newClient,
    message: "Cliente cadastrado com sucesso",
  });
});

// PUT /api/clients/:id — Update client
router.put("/api/clients/:id", (req: Request, res: Response) => {
  const idx = clientsStore.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }

  const body = req.body;
  const existing = clientsStore[idx];

  // Merge updates
  const updated: ClientRecord = {
    ...existing,
    ...body,
    id: existing.id,
    organizationId: existing.organizationId,
    slug: existing.slug,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  clientsStore[idx] = updated;
  saveClients(clientsStore);

  res.json({
    client: updated,
    message: "Cliente atualizado com sucesso",
  });
});

// ==========================================
// Helper: Meta Graph API Token Validation
// ==========================================
async function validateMetaToken(token: string) {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { valid: false, error: "Token não fornecido" };
  }

  try {
    // 1. Tentar /debug_token (funciona para User Tokens de admin/desenvolvedor do app)
    let debugData: any = null;
    try {
      const debugRes = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(cleanToken)}&access_token=${encodeURIComponent(cleanToken)}`
      );
      debugData = await debugRes.json();
    } catch {
      // Ignora erro e continua com /me
    }

    // 2. Tentar /me (funciona para User Tokens e System User Tokens)
    let meData: any = null;
    try {
      const meRes = await fetch(
        `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(cleanToken)}`
      );
      meData = await meRes.json();
    } catch {
      // Ignora erro
    }

    const isValidDebug = debugData?.data?.is_valid === true;
    const isValidMe = !!(meData?.id && !meData?.error);

    let adData: any = null;
    let bizData: any = null;
    let pageData: any = null;

    // 3. Se nem debug_token nem /me confirmaram, testa /me/adaccounts (tokens de System User com escopo específico)
    if (!isValidDebug && !isValidMe) {
      try {
        const adCheckRes = await fetch(
          `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name,account_id,currency,account_status&access_token=${encodeURIComponent(cleanToken)}`
        );
        adData = await adCheckRes.json();
      } catch {}

      const isValidAd = !!(adData?.data && !adData?.error);
      if (!isValidAd) {
        const rawError =
          meData?.error?.message ||
          debugData?.error?.message ||
          adData?.error?.message ||
          "Token inválido ou expirado";
        return {
          valid: false,
          error: rawError,
          details: { meData, debugData, adData },
        };
      }
    }

    // Token é funcional! Busca ativos vinculados em paralelo
    const promises: Promise<any>[] = [];

    if (!bizData) {
      promises.push(
        fetch(
          `https://graph.facebook.com/v20.0/me/businesses?fields=id,name,verification_status&access_token=${encodeURIComponent(cleanToken)}`
        )
          .then((r) => r.json())
          .then((d) => {
            bizData = d;
          })
          .catch(() => {})
      );
    }

    if (!adData) {
      promises.push(
        fetch(
          `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name,account_id,currency,account_status&access_token=${encodeURIComponent(cleanToken)}`
        )
          .then((r) => r.json())
          .then((d) => {
            adData = d;
          })
          .catch(() => {})
      );
    }

    if (!pageData) {
      promises.push(
        fetch(
          `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(cleanToken)}`
        )
          .then((r) => r.json())
          .then((d) => {
            pageData = d;
          })
          .catch(() => {})
      );
    }

    await Promise.all(promises);

    const businesses = Array.isArray(bizData?.data) ? bizData.data : [];
    const rawAdAccounts = Array.isArray(adData?.data) ? adData.data : [];
    const pages = Array.isArray(pageData?.data) ? pageData.data : [];

    // Formata contas de anúncios com identificadores limpos
    const adAccounts = rawAdAccounts.map((acc: any) => ({
      id: acc.id,
      accountId: acc.account_id || acc.id?.replace("act_", ""),
      name: acc.name || `Conta ${acc.account_id || acc.id}`,
      currency: acc.currency || "BRL",
      accountStatus: acc.account_status,
      amountSpent: acc.amount_spent,
    }));

    // Extrai contas do Instagram com username e dados limpos
    const instagramAccounts: Array<{
      id: string;
      username: string;
      name?: string;
      pageName?: string;
      pageId?: string;
      profilePictureUrl?: string;
    }> = [];

    const seenIgIds = new Set<string>();

    pages.forEach((page: any) => {
      if (page.instagram_business_account?.id) {
        const ig = page.instagram_business_account;
        if (!seenIgIds.has(ig.id)) {
          seenIgIds.add(ig.id);
          instagramAccounts.push({
            id: ig.id,
            username: ig.username || page.name,
            name: ig.name || ig.username || page.name,
            pageName: page.name,
            pageId: page.id,
            profilePictureUrl: ig.profile_picture_url,
          });
        }
      }
    });

    // Se houver Business Managers, também verifica se há contas de Instagram vinculadas diretamente à BM
    if (businesses.length > 0) {
      await Promise.allSettled(
        businesses.map(async (biz: any) => {
          try {
            const bizIgRes = await fetch(
              `https://graph.facebook.com/v20.0/${biz.id}/instagram_business_accounts?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(cleanToken)}`
            );
            const bizIgData = (await bizIgRes.json()) as any;
            if (Array.isArray(bizIgData?.data)) {
              bizIgData.data.forEach((ig: any) => {
                if (ig?.id && !seenIgIds.has(ig.id)) {
                  seenIgIds.add(ig.id);
                  instagramAccounts.push({
                    id: ig.id,
                    username: ig.username || ig.name || `IG_${ig.id}`,
                    name: ig.name || ig.username,
                    pageName: biz.name,
                    profilePictureUrl: ig.profile_picture_url,
                  });
                }
              });
            }
          } catch {}
        })
      );
    }

    return {
      valid: true,
      user: meData?.id ? { id: meData.id, name: meData.name } : undefined,
      businesses,
      adAccounts,
      instagramAccounts,
      pages,
      tokenInfo: debugData?.data || {
        is_valid: true,
        type: meData?.id ? "USER" : "SYSTEM_USER",
        user_id: meData?.id,
        user_name: meData?.name,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      error: "Erro ao comunicar com a API da Meta",
      details: err.message,
    };
  }
}

// POST /api/clients/validate-meta-token — Validação standalone (ex: na tela de novo cliente)
router.post(
  "/api/clients/validate-meta-token",
  async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ valid: false, error: "Token é obrigatório" });
    }

    const result = await validateMetaToken(token);
    return res.json(result);
  }
);

// POST /api/clients/:id/validate-meta-token — Validação e vinculo a cliente existente
router.post(
  "/api/clients/:id/validate-meta-token",
  async (req: Request, res: Response) => {
    const client = clientsStore.find((c) => c.id === req.params.id);
    if (!client) {
      return res.status(404).json({ valid: false, error: "Cliente não encontrado" });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ valid: false, error: "Token é obrigatório" });
    }

    const result = await validateMetaToken(token);
    if (result.valid) {
      client.metaTokenValid = true;
      if (result.businesses?.length) {
        client.metaBusinessId = result.businesses[0].id;
      }
      client.updatedAt = new Date().toISOString();
      saveClients(clientsStore);
    }

    return res.json(result);
  }
);

export const clientRoutes = router;
