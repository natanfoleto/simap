import { PrismaClient, Role, VehicleCategory, Criticality, MilestoneStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do SIMAP...");

  // 1. Criar ou atualizar Tenant inicial de Jaborandi/SP
  const tenant = await prisma.tenant.upsert({
    where: { slug: "jaborandi-sp" },
    update: {
      name: "Município de Jaborandi/SP",
      active: true,
    },
    create: {
      name: "Município de Jaborandi/SP",
      slug: "jaborandi-sp",
      cnpj: "45.742.695/0001-00",
      active: true,
    },
  });

  console.log(`✅ Tenant configurado: ${tenant.name} (${tenant.slug})`);

  // 2. Criar ou atualizar Projeto Institucional
  const existingProject = await prisma.project.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!existingProject) {
    await prisma.project.create({
      data: {
        tenantId: tenant.id,
        title: "Implementação de Manutenção Preventiva nos veículos públicos do município",
        systemName: "SIMAP",
        durationMonths: 8,
        theme: "Transporte Público",
      },
    });
  }

  // 3. Configurações do Projeto (Linha de base e metas)
  const settings = [
    { key: "BASELINE_YEAR", value: "2025", description: "Ano de referência da linha de base financeira" },
    { key: "BASELINE_AMOUNT", value: "285000.00", description: "Valor anual histórico em manutenção corretiva (R$)" },
    { key: "TARGET_REDUCTION_PERCENTAGE", value: "20.00", description: "Meta percentual de redução de custos (%)" },
    { key: "APP_TIMEZONE", value: "America/Sao_Paulo", description: "Fuso horário operacional padrão" },
  ];

  for (const s of settings) {
    await prisma.projectSetting.upsert({
      where: {
        tenantId_key: {
          tenantId: tenant.id,
          key: s.key,
        },
      },
      update: {
        value: s.value,
        description: s.description,
      },
      create: {
        tenantId: tenant.id,
        key: s.key,
        value: s.value,
        description: s.description,
      },
    });
  }
  console.log("✅ Configurações de linha de base e meta registradas");

  // 4. Marcos Institucionais do Pro Inova (M1 e M2 validados; M3 a M8 pendentes)
  const milestones = [
    {
      monthNumber: 1,
      title: "Mês 1: Diagnóstico da Frota",
      deliverable: "Diagnóstico completo e levantamento dos 97 veículos públicos",
      evidence: "Inventário da frota, classificação por categoria e relatório de situação",
      status: MilestoneStatus.VALIDADO,
      completionPercentage: 100,
      validatedAt: new Date("2025-01-31T23:59:59Z"),
    },
    {
      monthNumber: 2,
      title: "Mês 2: Plano de Manutenção Preventiva",
      deliverable: "Elaboração e validação dos planos de manutenção preventiva",
      evidence: "Tabela de periodicidade e checklist preliminar por categoria",
      status: MilestoneStatus.VALIDADO,
      completionPercentage: 100,
      validatedAt: new Date("2025-02-28T23:59:59Z"),
    },
    {
      monthNumber: 3,
      title: "Mês 3: Implantação da Preventiva e Operação Controlada",
      deliverable: "Início da rotina operacional em grupo piloto com checklists e ordens",
      evidence: "Ordens de serviço executadas e registros de hodômetro consistentes",
      status: MilestoneStatus.PENDENTE,
      completionPercentage: 0,
    },
    {
      monthNumber: 4,
      title: "Mês 4: Monitoramento, Ajustes e Visão Financeira",
      deliverable: "Acompanhamento de custos, corretivas vs preventivas e calibração",
      evidence: "Relatório gerencial com custos, disponibilidade e indicadores parciais",
      status: MilestoneStatus.PENDENTE,
      completionPercentage: 0,
    },
    {
      monthNumber: 5,
      title: "Mês 5: 1º Relatório Executivo de Desempenho",
      deliverable: "1º Relatório Executivo consolidando cenário anterior vs pós-implantação",
      evidence: "Comparativo de intervenções, custos por km e evolução da disponibilidade",
      status: MilestoneStatus.PENDENTE,
      completionPercentage: 0,
    },
    {
      monthNumber: 6,
      title: "Mês 6: Análise de Eficiência Operacional da Frota",
      deliverable: "Mapeamento dos veículos mais críticos por custo e tempo de parada",
      evidence: "Classificação por criticidade e matriz de eficiência segmentada",
      status: MilestoneStatus.PENDENTE,
      completionPercentage: 0,
    },
    {
      monthNumber: 7,
      title: "Mês 7: Relatório de Otimização e Recomendações",
      deliverable: "Propostas formais de melhoria, revisão de uso e ajustes de periodicidade",
      evidence: "Relatório formal de recomendações e simulações orçamentárias",
      status: MilestoneStatus.PENDENTE,
      completionPercentage: 0,
    },
    {
      monthNumber: 8,
      title: "Mês 8: Relatório Consolidado ao Prefeito e Transparência",
      deliverable: "Balanço dos 8 meses de execução e publicação no portal de transparência",
      evidence: "Documento executivo final e painel público de indicadores agregados",
      status: MilestoneStatus.PENDENTE,
      completionPercentage: 0,
    },
  ];

  for (const m of milestones) {
    await prisma.projectMilestone.upsert({
      where: {
        tenantId_monthNumber: {
          tenantId: tenant.id,
          monthNumber: m.monthNumber,
        },
      },
      update: {
        title: m.title,
        deliverable: m.deliverable,
        evidence: m.evidence,
        status: m.status,
        completionPercentage: m.completionPercentage,
        validatedAt: m.validatedAt,
      },
      create: {
        tenantId: tenant.id,
        monthNumber: m.monthNumber,
        title: m.title,
        deliverable: m.deliverable,
        evidence: m.evidence,
        status: m.status,
        completionPercentage: m.completionPercentage,
        validatedAt: m.validatedAt,
      },
    });
  }
  console.log("✅ 8 Marcos do Pro Inova sincronizados (M1 e M2 validados)");

  // 5. Usuário Administrador Inicial
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@simap.local";
  const adminName = process.env.SEED_ADMIN_NAME || "Administrador SIMAP";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin_jaborandi_2025";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
      tenantId: tenant.id,
      active: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      tenantId: tenant.id,
      active: true,
    },
  });
  console.log(`✅ Usuário Administrador configurado: ${adminUser.email}`);

  // 6. Planos Preventivos Base (Conforme Entregável do Mês 2)
  const basePlans = [
    {
      name: "Plano Preventivo Padrão — Ônibus e Micro-ônibus",
      category: VehicleCategory.ONIBUS,
      description: "Plano de manutenção preventiva para frota de transporte escolar e coletivo",
      items: [
        { name: "Troca de Óleo do Motor e Filtros de Óleo/Combustível", intervalKm: 10000, intervalDays: 90, toleranceKm: 500, toleranceDays: 7, priority: Criticality.ALTA },
        { name: "Inspeção e Regulagem do Sistema de Freios (Lonas/Tambores)", intervalKm: 15000, intervalDays: 120, toleranceKm: 1000, toleranceDays: 10, priority: Criticality.CRITICA },
        { name: "Rodízio, Alinhamento e Balanceamento de Pneus", intervalKm: 10000, intervalDays: 90, toleranceKm: 500, toleranceDays: 7, priority: Criticality.MEDIA },
        { name: "Revisão do Sistema de Suspensão e Direção", intervalKm: 20000, intervalDays: 180, toleranceKm: 1000, toleranceDays: 15, priority: Criticality.ALTA },
        { name: "Checagem do Sistema Elétrico e Iluminação", intervalKm: 5000, intervalDays: 30, toleranceKm: 200, toleranceDays: 3, priority: Criticality.ALTA },
      ],
    },
    {
      name: "Plano Preventivo Padrão — Ambulâncias e Saúde",
      category: VehicleCategory.AMBULANCIA,
      description: "Plano preventivo para veículos de urgência e emergência médica",
      items: [
        { name: "Troca de Óleo Sintético e Filtros Gerais", intervalKm: 7500, intervalDays: 90, toleranceKm: 300, toleranceDays: 5, priority: Criticality.CRITICA },
        { name: "Verificação de Freios, Pastilhas e Fluido", intervalKm: 10000, intervalDays: 60, toleranceKm: 500, toleranceDays: 5, priority: Criticality.CRITICA },
        { name: "Inspeção do Sistema de Arrefecimento e Correias", intervalKm: 15000, intervalDays: 120, toleranceKm: 500, toleranceDays: 7, priority: Criticality.ALTA },
        { name: "Verificação de Pneus e Pressão", intervalKm: 5000, intervalDays: 30, toleranceKm: 200, toleranceDays: 3, priority: Criticality.CRITICA },
        { name: "Revisão do Sistema Elétrico Secundário (Sinalizadores/Sirene/Inversor)", intervalKm: 10000, intervalDays: 60, toleranceKm: 500, toleranceDays: 5, priority: Criticality.ALTA },
      ],
    },
    {
      name: "Plano Preventivo Padrão — Veículos Leves e Carros",
      category: VehicleCategory.CARRO,
      description: "Plano preventivo para frota leve administrativa e serviços gerais",
      items: [
        { name: "Troca de Óleo do Motor e Filtro de Óleo", intervalKm: 10000, intervalDays: 180, toleranceKm: 500, toleranceDays: 15, priority: Criticality.ALTA },
        { name: "Filtro de Ar do Motor e Filtro de Cabine", intervalKm: 10000, intervalDays: 180, toleranceKm: 500, toleranceDays: 15, priority: Criticality.MEDIA },
        { name: "Inspeção de Pastilhas e Discos de Freio", intervalKm: 15000, intervalDays: 180, toleranceKm: 1000, toleranceDays: 15, priority: Criticality.ALTA },
        { name: "Alinhamento, Balanceamento e Calibragem", intervalKm: 10000, intervalDays: 180, toleranceKm: 500, toleranceDays: 15, priority: Criticality.MEDIA },
      ],
    },
    {
      name: "Plano Preventivo Padrão — Vans e Utilitários",
      category: VehicleCategory.VAN,
      description: "Plano preventivo para transporte de pacientes e equipes",
      items: [
        { name: "Troca de Óleo e Todos os Filtros", intervalKm: 10000, intervalDays: 120, toleranceKm: 500, toleranceDays: 10, priority: Criticality.ALTA },
        { name: "Checagem do Sistema de Freios e Embreagem", intervalKm: 15000, intervalDays: 120, toleranceKm: 1000, toleranceDays: 10, priority: Criticality.CRITICA },
        { name: "Inspeção de Suspensão e Amortecedores", intervalKm: 20000, intervalDays: 180, toleranceKm: 1000, toleranceDays: 15, priority: Criticality.MEDIA },
      ],
    },
    {
      name: "Plano Preventivo Padrão — Caminhões e Linha Pesada",
      category: VehicleCategory.CAMINHAO,
      description: "Plano preventivo para basculantes, coleta e serviços urbanos",
      items: [
        { name: "Troca de Óleo do Motor Diesel e Lubrificação Geral de Chassis", intervalKm: 10000, intervalDays: 90, toleranceKm: 500, toleranceDays: 10, priority: Criticality.CRITICA },
        { name: "Drenagem e Troca do Filtro Separador de Água", intervalKm: 5000, intervalDays: 45, toleranceKm: 300, toleranceDays: 5, priority: Criticality.ALTA },
        { name: "Revisão do Sistema Pneumático de Freios e Válvulas", intervalKm: 15000, intervalDays: 120, toleranceKm: 1000, toleranceDays: 10, priority: Criticality.CRITICA },
      ],
    },
  ];

  for (const planData of basePlans) {
    const existingPlan = await prisma.preventivePlan.findFirst({
      where: {
        tenantId: tenant.id,
        category: planData.category,
      },
    });

    let planId = existingPlan?.id;

    if (!existingPlan) {
      const createdPlan = await prisma.preventivePlan.create({
        data: {
          tenantId: tenant.id,
          name: planData.name,
          category: planData.category,
          description: planData.description,
          version: 1,
          isPublished: true,
          active: true,
        },
      });
      planId = createdPlan.id;
    }

    if (planId) {
      for (let i = 0; i < planData.items.length; i++) {
        const item = planData.items[i];
        const existingItem = await prisma.preventivePlanItem.findFirst({
          where: {
            planId,
            name: item.name,
          },
        });

        if (!existingItem) {
          await prisma.preventivePlanItem.create({
            data: {
              planId,
              tenantId: tenant.id,
              name: item.name,
              intervalKm: item.intervalKm,
              intervalDays: item.intervalDays,
              toleranceKm: item.toleranceKm,
              toleranceDays: item.toleranceDays,
              priority: item.priority,
              isMandatory: true,
              active: true,
              orderIndex: i,
            },
          });
        }
      }
    }
  }
  console.log("✅ Planos preventivos base cadastrados para todas as categorias principais");

  // 7. Templates de Checklist Operacional Diário (R1)
  const baseChecklists = [
    {
      name: "Checklist Diário — Ônibus e Transporte Escolar",
      category: VehicleCategory.ONIBUS,
      description: "Inspeção diária obrigatória antes da saída da rota escolar e coletiva",
      items: [
        "Nível do óleo do motor e líquido de arrefecimento",
        "Pressão e funcionamento do sistema pneumático de freios",
        "Faróis, lanternas, setas, luzes de ré e freio",
        "Condições visuais e calibragem dos pneus",
        "Portas de embarque, travas e saída de emergência",
        "Cintos de segurança dos passageiros e do motorista",
        "Limpadores de para-brisa, retrovisores e buzina",
        "Disco de tacógrafo e documentação de bordo",
      ],
    },
    {
      name: "Checklist Diário — Ambulância e Emergência",
      category: VehicleCategory.AMBULANCIA,
      description: "Inspeção operacional e de prontidão para veículos de atendimento de urgência",
      items: [
        "Nível de óleo, arrefecimento e fluido de freio",
        "Funcionamento de sinalizador acústico (sirene) e visual (giroflex)",
        "Condição dos pneus e pressão do estepe",
        "Sistema de freios e direção hidráulica",
        "Iluminação interna do salão de atendimento",
        "Fixação da maca e suportes de cilindros",
        "Inversor elétrico e tomadas da viatura",
      ],
    },
    {
      name: "Checklist Diário — Veículos Leves e Administrativos",
      category: VehicleCategory.CARRO,
      description: "Inspeção padrão para frota leve administrativa e serviços gerais",
      items: [
        "Nível do óleo do motor e água do radiador",
        "Funcionamento de todas as luzes e faróis",
        "Calibragem dos pneus e estepe",
        "Eficiência do freio de pedal e freio de mão",
        "Palhetas do limpador e água do lavador",
      ],
    },
    {
      name: "Checklist Diário — Caminhões e Linha Pesada",
      category: VehicleCategory.CAMINHAO,
      description: "Inspeção para caminhões basculantes, coleta e serviços urbanos",
      items: [
        "Nível do óleo e dreno do filtro separador de água",
        "Pressão do sistema de ar dos freios",
        "Sinalização noturna, faixas refletivas e luzes",
        "Aperto visual de porcas de rodas e estado dos pneus",
        "Funcionamento da tomada de força / caçamba (se aplicável)",
      ],
    },
  ];

  for (const chk of baseChecklists) {
    const existingTemplate = await prisma.checklistTemplate.findFirst({
      where: {
        tenantId: tenant.id,
        category: chk.category,
      },
    });

    let templateId = existingTemplate?.id;

    if (!existingTemplate) {
      const createdTemplate = await prisma.checklistTemplate.create({
        data: {
          tenantId: tenant.id,
          name: chk.name,
          category: chk.category,
          description: chk.description,
          active: true,
        },
      });
      templateId = createdTemplate.id;
    }

    if (templateId) {
      for (let i = 0; i < chk.items.length; i++) {
        const itemTitle = chk.items[i];
        const existingItem = await prisma.checklistTemplateItem.findFirst({
          where: { templateId, title: itemTitle },
        });

        if (!existingItem) {
          await prisma.checklistTemplateItem.create({
            data: {
              tenantId: tenant.id,
              templateId,
              title: itemTitle,
              orderIndex: i,
              active: true,
            },
          });
        }
      }
    }
  }
  console.log("✅ Templates padrão de checklist cadastrados para todas as categorias");

  // 8. Usuários Operador e Motorista para teste local
  const motoristaPassword = await bcrypt.hash("motorista_123", 10);
  await prisma.user.upsert({
    where: { email: "motorista@simap.local" },
    update: { active: true },
    create: {
      name: "Carlos Motorista",
      email: "motorista@simap.local",
      passwordHash: motoristaPassword,
      role: Role.MOTORISTA,
      tenantId: tenant.id,
      active: true,
    },
  });

  const operadorPassword = await bcrypt.hash("operador_123", 10);
  await prisma.user.upsert({
    where: { email: "operador@simap.local" },
    update: { active: true },
    create: {
      name: "Mariana Operadora",
      email: "operador@simap.local",
      passwordHash: operadorPassword,
      role: Role.OPERADOR,
      tenantId: tenant.id,
      active: true,
    },
  });
  console.log("✅ Usuários Motorista e Operador adicionados para teste local");

  console.log("✨ Seed do SIMAP concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
