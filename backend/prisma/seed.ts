import { PrismaClient, UserRole, TaskStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding GFB Growth OS database...");

  const passwordHash = await bcrypt.hash("gfb2026@master", 10);

  // 1. Create Organization (GFB Digital)
  const org = await prisma.organization.upsert({
    where: { slug: "gfb-digital" },
    update: {},
    create: {
      name: "GFB Digital",
      slug: "gfb-digital",
      plan: "ENTERPRISE",
    },
  });

  // 2. Create Super Admin / Agency Owner
  const owner = await prisma.user.upsert({
    where: { email: "gisley@gfbdigital.com.br" },
    update: {},
    create: {
      email: "gisley@gfbdigital.com.br",
      name: "Gisley Fernandes",
      passwordHash,
      isActive: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: UserRole.OWNER,
        },
      },
    },
  });

  // 3. Create Sample Gestor de Tráfego
  const gestor = await prisma.user.upsert({
    where: { email: "gestor@gfbdigital.com.br" },
    update: {},
    create: {
      email: "gestor@gfbdigital.com.br",
      name: "Gestor de Tráfego Alpha",
      passwordHash,
      isActive: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: UserRole.GESTOR,
        },
      },
    },
  });

  // 4. Create Sample Client (Bruna Ortiz - PPP)
  const client = await prisma.client.upsert({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: "brunaortiz_ppp",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "Bruna Ortiz - PPP",
      slug: "brunaortiz_ppp",
      revenueGoalCents: BigInt(15000000), // R$ 150.000,00 de meta mensal
      isActive: true,
      members: {
        create: [
          {
            userId: gestor.id,
            isPrimaryGestor: true,
          },
        ],
      },
      pixels: {
        create: {
          pixelId: "123456789012345",
          pixelKey: "brunaortiz_ppp",
          capiToken: "EAAB_SAMPLE_META_ACCESS_TOKEN_GFB",
          isActive: true,
        },
      },
      products: {
        create: {
          name: "Programa Primeira Página (PPP)",
          externalId: "kiwi_prod_ppp_001",
          platform: "KIWIFY",
          priceCents: BigInt(99700), // R$ 997,00
          isActive: true,
        },
      },
    },
  });

  // 5. Create Initial Onboarding Tasks (ClickUp Style)
  const tasksToCreate = [
    {
      title: "Verificação e Blindagem do CAPI (Meta Graph API)",
      descriptionMarkdown: "Verificar o disparo de PageView e InitiateCheckout com EMQ superior a 8.5.",
      priority: TaskPriority.URGENT,
      status: TaskStatus.DONE,
      timeEstimateMinutes: 60,
    },
    {
      title: "Configurar Instância de WhatsApp e SendGate Anti-Ban",
      descriptionMarkdown: "Conectar instância Evolution v2 e inicializar rotina de aquecimento com cronotipo madrugador.",
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      timeEstimateMinutes: 45,
    },
    {
      title: "Subir Criativos de Validação de Escala",
      descriptionMarkdown: "Testar novos ângulos de Reels com legenda 9:16 e destaque de palavras.",
      priority: TaskPriority.NORMAL,
      status: TaskStatus.TODO,
      timeEstimateMinutes: 120,
    },
    {
      title: "Ativar Régua de Recuperação de Carrinho e PIX Pendente",
      descriptionMarkdown: "Conectar webhook Kiwify e validar fechamento automático de recuperação pós-compra.",
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      timeEstimateMinutes: 90,
    },
  ];

  for (const t of tasksToCreate) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        creatorUserId: owner.id,
        assignedUserId: gestor.id,
        title: t.title,
        descriptionMarkdown: t.descriptionMarkdown,
        priority: t.priority,
        status: t.status,
        timeEstimateMinutes: t.timeEstimateMinutes,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Em 3 dias
      },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log(`- Organization: ${org.name} (${org.slug})`);
  console.log(`- Owner: ${owner.email}`);
  console.log(`- Gestor: ${gestor.email}`);
  console.log(`- Client: ${client.name} (${client.slug})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
