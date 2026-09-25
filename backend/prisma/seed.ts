import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando Database Seeding do GFB Growth OS...");

  // 1. Organização Agência Master
  const org = await prisma.organization.upsert({
    where: { slug: "gfb-digital" },
    update: {},
    create: {
      id: "org_gfb_master",
      name: "GFB Digital Master Agency",
      slug: "gfb-digital",
      plan: "ENTERPRISE",
      isActive: true,
    },
  });
  console.log(`✅ Organização criada/verificada: ${org.name}`);

  // 2. Usuários Principais
  const passwordHash = await bcrypt.hash("gfb@growth2026", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "gisley@gfbdigital.com.br" },
    update: {},
    create: {
      id: "usr_gisley_master",
      email: "gisley@gfbdigital.com.br",
      name: "Gisley Fernandes",
      passwordHash,
      isActive: true,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gisley",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "contato@brunaortiz.com.br" },
    update: {},
    create: {
      id: "usr_bruna_client",
      email: "contato@brunaortiz.com.br",
      name: "Bruna Ortiz",
      passwordHash,
      isActive: true,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruna",
    },
  });

  // Vincular membro na organização
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: adminUser.id,
      role: "SUPER_ADMIN",
    },
  });

  // 3. Cliente: Bruna Ortiz - Pílula da Produtividade
  const client = await prisma.client.upsert({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: "brunaortiz-ppp",
      },
    },
    update: {},
    create: {
      id: "cli_bruna_ppp",
      organizationId: org.id,
      name: "Bruna Ortiz (Pílula da Produtividade)",
      slug: "brunaortiz-ppp",
      revenueGoalCents: BigInt(20000000), // R$ 200.000,00
      isActive: true,
    },
  });
  console.log(`✅ Cliente cadastrado: ${client.name}`);

  // 4. Pixel CAPI
  await prisma.clientPixel.upsert({
    where: { pixelKey: "brunaortiz_ppp" },
    update: {},
    create: {
      clientId: client.id,
      pixelId: "88492019482910",
      pixelKey: "brunaortiz_ppp",
      capiToken: "EAABs8109dsmAkP98127391823719283719827391827391827",
      testCode: "TEST89123",
      isActive: true,
    },
  });

  // 5. Mini ClickUp: Tarefas Iniciais do Lançamento
  const initialTasks = [
    {
      title: "Configurar Snippet CAPI e Webhook Kiwify",
      descriptionMarkdown: "Instalar tag `/s/brunaortiz_ppp.js` na página de obrigado e no checkout da Kiwify para deduplicação.",
      status: "DONE" as const,
      priority: "URGENT" as const,
      dueDate: new Date("2026-09-24"),
      timeEstimateMinutes: 45,
      timeSpentMinutes: 45,
    },
    {
      title: "Aquecer 5 Chips no Warming Network P2P",
      descriptionMarkdown: "Executar curvas graduais de 15 a 85 mensagens/dia simulando áudio e digitação natural.",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      dueDate: new Date("2026-09-26"),
      timeEstimateMinutes: 90,
      timeSpentMinutes: 45,
    },
    {
      title: "Renderizar 12 Vídeos de Criativos em 9:16 (Legenda Rápida)",
      descriptionMarkdown: "Cortar silêncios acima de 500ms e aplicar legenda dinâmica vertical no estilo Hormozi.",
      status: "TODO" as const,
      priority: "NORMAL" as const,
      dueDate: new Date("2026-09-28"),
      timeEstimateMinutes: 120,
      timeSpentMinutes: 0,
    },
    {
      title: "Importar Base de 4.081 Leads CSV com Normalização E.164",
      descriptionMarkdown: "Fazer upload da base histórica, sanitizar telefones para +55 e calcular scores RFM.",
      status: "DONE" as const,
      priority: "HIGH" as const,
      dueDate: new Date("2026-09-25"),
      timeEstimateMinutes: 60,
      timeSpentMinutes: 30,
    },
  ];

  for (const t of initialTasks) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        createdById: adminUser.id,
        assignedToId: adminUser.id,
        title: t.title,
        descriptionMarkdown: t.descriptionMarkdown,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        timeEstimateMinutes: t.timeEstimateMinutes,
        timeSpentMinutes: t.timeSpentMinutes,
        labels: ["Mini ClickUp", "Lançamento"],
      },
    });
  }

  console.log("✅ 4 Tarefas operacionais do Mini ClickUp semeadas.");
  console.log("🎉 Seeding finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
