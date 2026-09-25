/**
 * GFB Growth OS — In-Memory Mock Database & Seed Store
 * Permite que todo o sistema, APIs e frontend rodem de forma 100% autônoma
 * com dados reais e consistentes, sem necessidade de banco local ativo.
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "GESTOR" | "CLIENT";
  avatarUrl: string;
  organizationId: string;
}

export interface MockClient {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  revenueGoalCents: bigint;
  currentRevenueCents: bigint;
  todayRevenueCents: bigint;
  status: "ACTIVE" | "PAUSED";
  assignedGestorId: string;
  pixelKey: string;
  pixelId: string;
}

export interface MockTask {
  id: string;
  clientId: string;
  title: string;
  descriptionMarkdown: string;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  assignedUserId: string;
  dueDate: string;
  timeEstimateMinutes: number;
  timeSpentMinutes: number;
  labels: string[];
}

export interface MockLead {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  temperature: "HOT" | "WARM" | "COLD" | "INACTIVE";
  stage: "LEAD" | "BUYER" | "RECURRING" | "VIP";
  rfmPoints: number;
  totalSpentCents: bigint;
  purchaseCount: number;
  lastSeen: string;
  attributionSource?: string;
}

export interface MockOrder {
  id: string;
  clientId: string;
  leadName: string;
  leadEmail: string;
  productName: string;
  grossAmountCents: bigint;
  status: "CONFIRMED" | "PENDING" | "REFUNDED" | "CHARGEBACK";
  platform: "KIWIFY" | "HOTMART";
  isAttributedToAds: boolean;
  adCampaignName?: string;
  createdAt: string;
  capiStatus: "SENT" | "PENDING" | "FAILED";
}

export interface MockWhatsAppInstance {
  id: string;
  name: string;
  instanceKey: string;
  phone: string;
  status: "CONNECTED" | "DISCONNECTED" | "QR_READY" | "QUARANTINED";
  warmingScore: number;
  banRiskScore: number;
  dailySendCap: number;
  sentTodayCount: number;
}

export interface MockLaunch {
  id: string;
  clientId: string;
  name: string;
  slug: string;
  currentMembers: number;
  maxMembers: number;
  groupCount: number;
  conversionRatePct: number;
}

class MockDataStore {
  public organization = {
    id: "org_gfb_digital",
    name: "GFB Digital",
    slug: "gfb-digital",
    plan: "ENTERPRISE",
  };

  public users: MockUser[] = [
    {
      id: "usr_gisley",
      name: "Gisley Fernandes",
      email: "gisley@gfbdigital.com.br",
      role: "OWNER",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gisley",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_gestor",
      name: "Arthur Gestor",
      email: "gestor@gfbdigital.com.br",
      role: "GESTOR",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arthur",
      organizationId: "org_gfb_digital",
    },
    {
      id: "usr_bruna",
      name: "Bruna Ortiz",
      email: "cliente@brunaortiz.com.br",
      role: "CLIENT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruna",
      organizationId: "org_gfb_digital",
    },
  ];

  public clients: MockClient[] = [
    {
      id: "cli_bruna_ppp",
      organizationId: "org_gfb_digital",
      name: "Bruna Ortiz - PPP",
      slug: "brunaortiz_ppp",
      revenueGoalCents: BigInt(15000000), // R$ 150.000,00
      currentRevenueCents: BigInt(8740000), // R$ 87.400,00
      todayRevenueCents: BigInt(897000), // R$ 8.970,00 hoje
      status: "ACTIVE",
      assignedGestorId: "usr_gestor",
      pixelKey: "brunaortiz_ppp",
      pixelId: "123456789012345",
    },
    {
      id: "cli_theodoro",
      organizationId: "org_gfb_digital",
      name: "Theodoro Cursos Presenciais",
      slug: "theodoro_cursospresenciais",
      revenueGoalCents: BigInt(20000000), // R$ 200.000,00
      currentRevenueCents: BigInt(14200000), // R$ 142.000,00
      todayRevenueCents: BigInt(1250000), // R$ 12.500,00 hoje
      status: "ACTIVE",
      assignedGestorId: "usr_gisley",
      pixelKey: "theodoro_cursospresenciais",
      pixelId: "987654321098765",
    },
  ];

  public tasks: MockTask[] = [
    {
      id: "tsk_1",
      clientId: "cli_bruna_ppp",
      title: "Verificação e Blindagem do CAPI (Meta Graph API)",
      descriptionMarkdown: "Validar Event Match Quality (EMQ) nos eventos de PageView e Purchase para alcançar 8.9+.",
      status: "DONE",
      priority: "URGENT",
      assignedUserId: "usr_gestor",
      dueDate: "2026-09-28",
      timeEstimateMinutes: 60,
      timeSpentMinutes: 55,
      labels: ["Tracking", "CAPI", "Meta Ads"],
    },
    {
      id: "tsk_2",
      clientId: "cli_bruna_ppp",
      title: "Configurar Instância de WhatsApp e SendGate Anti-Ban",
      descriptionMarkdown: "Conectar instância Evolution API v2 e inicializar aquecimento matemático com cronotipo padrão.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedUserId: "usr_gestor",
      dueDate: "2026-09-29",
      timeEstimateMinutes: 45,
      timeSpentMinutes: 20,
      labels: ["WhatsApp", "Warming"],
    },
    {
      id: "tsk_3",
      clientId: "cli_bruna_ppp",
      title: "Subir Criativos com Legenda Rápida 9:16",
      descriptionMarkdown: "Gerar 5 variações com palavras destacadas e corte seco de silêncio para a campanha de escala.",
      status: "TODO",
      priority: "NORMAL",
      assignedUserId: "usr_gestor",
      dueDate: "2026-09-30",
      timeEstimateMinutes: 120,
      timeSpentMinutes: 0,
      labels: ["Vídeo AI", "Criativos"],
    },
    {
      id: "tsk_4",
      clientId: "cli_bruna_ppp",
      title: "Ativar Régua de Recuperação de Carrinho e PIX Pendente",
      descriptionMarkdown: "Webhook Kiwify conectado com fechamento automático da recuperação ao aprovar compra.",
      status: "TODO",
      priority: "HIGH",
      assignedUserId: "usr_gestor",
      dueDate: "2026-10-01",
      timeEstimateMinutes: 90,
      timeSpentMinutes: 0,
      labels: ["CRM", "Recuperação"],
    },
    {
      id: "tsk_5",
      clientId: "cli_theodoro",
      title: "Planejamento de Lançamento Meteórico (SendFlow)",
      descriptionMarkdown: "Estruturar links dinâmicos /l/theodoro-turma-5 com grupos do WhatsApp e Telegram.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      assignedUserId: "usr_gisley",
      dueDate: "2026-09-27",
      timeEstimateMinutes: 180,
      timeSpentMinutes: 90,
      labels: ["Lançamento", "Grupos"],
    },
  ];

  public orders: MockOrder[] = [
    {
      id: "ord_101",
      clientId: "cli_bruna_ppp",
      leadName: "Camila Ribeiro",
      leadEmail: "camila.ribeiro@gmail.com",
      productName: "Programa Primeira Página (PPP)",
      grossAmountCents: BigInt(99700),
      status: "CONFIRMED",
      platform: "KIWIFY",
      isAttributedToAds: true,
      adCampaignName: "[CBO] Escala - Criativo 03 - Vídeo Legenda",
      createdAt: "2026-09-25T09:12:00Z",
      capiStatus: "SENT",
    },
    {
      id: "ord_102",
      clientId: "cli_bruna_ppp",
      leadName: "Rodrigo Silveira",
      leadEmail: "rodrigo.s@hotmail.com",
      productName: "Programa Primeira Página (PPP) + Bump Mentor",
      grossAmountCents: BigInt(149400),
      status: "CONFIRMED",
      platform: "KIWIFY",
      isAttributedToAds: true,
      adCampaignName: "[ABO] Remarketing WhatsApp",
      createdAt: "2026-09-25T08:45:00Z",
      capiStatus: "SENT",
    },
    {
      id: "ord_103",
      clientId: "cli_bruna_ppp",
      leadName: "Juliana Santos",
      leadEmail: "juliana.santos@outlook.com",
      productName: "Programa Primeira Página (PPP)",
      grossAmountCents: BigInt(99700),
      status: "PENDING",
      platform: "KIWIFY",
      isAttributedToAds: true,
      adCampaignName: "[CBO] Escala - Criativo 01",
      createdAt: "2026-09-25T08:15:00Z",
      capiStatus: "PENDING",
    },
    {
      id: "ord_104",
      clientId: "cli_theodoro",
      leadName: "Felipe Andrade",
      leadEmail: "felipe.andrade@empresa.com.br",
      productName: "Imersão Presencial São Paulo",
      grossAmountCents: BigInt(299700),
      status: "CONFIRMED",
      platform: "HOTMART",
      isAttributedToAds: true,
      adCampaignName: "[Lançamento] Convite Grupo VIP",
      createdAt: "2026-09-25T07:30:00Z",
      capiStatus: "SENT",
    },
  ];

  public leads: MockLead[] = [
    {
      id: "lead_1",
      clientId: "cli_bruna_ppp",
      name: "Camila Ribeiro",
      email: "camila.ribeiro@gmail.com",
      phone: "+5511987654321",
      temperature: "HOT",
      stage: "BUYER",
      rfmPoints: 120,
      totalSpentCents: BigInt(99700),
      purchaseCount: 1,
      lastSeen: "2026-09-25T09:12:00Z",
      attributionSource: "Meta Ads (CAPI)",
    },
    {
      id: "lead_2",
      clientId: "cli_bruna_ppp",
      name: "Rodrigo Silveira",
      email: "rodrigo.s@hotmail.com",
      phone: "+5521998877665",
      temperature: "HOT",
      stage: "VIP",
      rfmPoints: 310,
      totalSpentCents: BigInt(349000),
      purchaseCount: 3,
      lastSeen: "2026-09-25T08:45:00Z",
      attributionSource: "WhatsApp Direct",
    },
    {
      id: "lead_3",
      clientId: "cli_bruna_ppp",
      name: "Juliana Santos",
      email: "juliana.santos@outlook.com",
      phone: "+5531991234567",
      temperature: "WARM",
      stage: "LEAD",
      rfmPoints: 35,
      totalSpentCents: BigInt(0),
      purchaseCount: 0,
      lastSeen: "2026-09-25T08:15:00Z",
      attributionSource: "Meta Ads (PIX Pendente)",
    },
  ];

  public whatsappInstances: MockWhatsAppInstance[] = [
    {
      id: "inst_1",
      name: "WhatsApp Oficial GFB",
      instanceKey: "gfb_master_01",
      phone: "+5511999990001",
      status: "CONNECTED",
      warmingScore: 92,
      banRiskScore: 4,
      dailySendCap: 150,
      sentTodayCount: 42,
    },
    {
      id: "inst_2",
      name: "Atendimento Bruna Ortiz",
      instanceKey: "aqc_bruna_01",
      phone: "+5511999990002",
      status: "CONNECTED",
      warmingScore: 84,
      banRiskScore: 8,
      dailySendCap: 80,
      sentTodayCount: 26,
    },
  ];

  public launches: MockLaunch[] = [
    {
      id: "lnc_1",
      clientId: "cli_bruna_ppp",
      name: "Lançamento Meteórico Bruna - Turma Outubro",
      slug: "bruna-vip",
      currentMembers: 984,
      maxMembers: 1024,
      groupCount: 4,
      conversionRatePct: 14.8,
    },
    {
      id: "lnc_2",
      clientId: "cli_theodoro",
      name: "Imersão Presencial VIP",
      slug: "theodoro-vip",
      currentMembers: 1420,
      maxMembers: 2000,
      groupCount: 2,
      conversionRatePct: 22.4,
    },
  ];
}

export const mockDb = new MockDataStore();
