import {
  PrismaClient,
  Role,
  VehicleCategory,
  VehicleStatus,
  Criticality,
  MilestoneStatus,
  OdometerSource,
  MaintenanceType,
  OrderStatus,
  InspectionAnswerStatus,
} from "@prisma/client";
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

  // 5. Usuários do Sistema
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

  const motoristaPassword = await bcrypt.hash("motorista_123", 10);
  const motoristaUser = await prisma.user.upsert({
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
  const operadorUser = await prisma.user.upsert({
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
  console.log("✅ Usuários Motorista e Operador configurados");

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

  const planIdByCategory: Record<string, string> = {};

  for (const planData of basePlans) {
    let plan = await prisma.preventivePlan.findFirst({
      where: {
        tenantId: tenant.id,
        category: planData.category,
      },
    });

    if (!plan) {
      plan = await prisma.preventivePlan.create({
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
    }

    planIdByCategory[planData.category] = plan.id;

    for (let i = 0; i < planData.items.length; i++) {
      const item = planData.items[i];
      const existingItem = await prisma.preventivePlanItem.findFirst({
        where: {
          planId: plan.id,
          name: item.name,
        },
      });

      if (!existingItem) {
        await prisma.preventivePlanItem.create({
          data: {
            planId: plan.id,
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

  const templateIdByCategory: Record<string, string> = {};

  for (const chk of baseChecklists) {
    let template = await prisma.checklistTemplate.findFirst({
      where: {
        tenantId: tenant.id,
        category: chk.category,
      },
    });

    if (!template) {
      template = await prisma.checklistTemplate.create({
        data: {
          tenantId: tenant.id,
          name: chk.name,
          category: chk.category,
          description: chk.description,
          active: true,
        },
      });
    }

    templateIdByCategory[chk.category] = template.id;

    for (let i = 0; i < chk.items.length; i++) {
      const itemTitle = chk.items[i];
      const existingItem = await prisma.checklistTemplateItem.findFirst({
        where: { templateId: template.id, title: itemTitle },
      });

      if (!existingItem) {
        await prisma.checklistTemplateItem.create({
          data: {
            tenantId: tenant.id,
            templateId: template.id,
            title: itemTitle,
            orderIndex: i,
            active: true,
          },
        });
      }
    }
  }
  console.log("✅ Templates padrão de checklist cadastrados para todas as categorias");

  // 8. Base Inicial de Dados da Frota — 97 Veículos Ativos (Diagnóstico Inicial de Jaborandi/SP)
  const initialFleet = [
    // -------------------------------------------------------------------------
    // GRUPO: DIESEL (59 ATIVOS)
    // -------------------------------------------------------------------------
    {
      fleetCode: "CAM-01",
      plate: "BFY0504",
      category: VehicleCategory.CAMINHAO,
      brand: "Volkswagen",
      model: "VOLKSWAGEN 7110S-BAU",
      year: 1988,
      fuelType: "Diesel",
      purpose: "Transporte de materiais e equipamentos",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 215400,
      isPilot: false,
    },
    {
      fleetCode: "CAM-02",
      plate: "BFY4057",
      category: VehicleCategory.CAMINHAO,
      brand: "Ford",
      model: "CAMINHÃO FORD F-12000",
      year: 2004,
      fuelType: "Diesel",
      purpose: "Transporte pesado e manutenção urbana",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 184200,
      isPilot: false,
    },
    {
      fleetCode: "CAM-03",
      plate: "BSV3410",
      category: VehicleCategory.CAMINHAO,
      brand: "Mercedes-Benz",
      model: "CAMINHAO BASCULANTE",
      year: 1972,
      fuelType: "Diesel",
      purpose: "Transporte de cascalho e terraplanagem",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 312000,
      isPilot: false,
    },
    {
      fleetCode: "ONB-01",
      plate: "BSZ6C24",
      category: VehicleCategory.ONIBUS,
      brand: "Mercedes-Benz / Caio",
      model: "CAIO LO 916. ORE",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Transporte Escolar (ORE)",
      department: "Educação",
      criticality: Criticality.CRITICA,
      currentOdometer: 48350,
      isPilot: true,
    },
    {
      fleetCode: "CAM-04",
      plate: "BVT5163",
      category: VehicleCategory.CAMINHAO,
      brand: "Volkswagen",
      model: "VW 14.190 CRM 4X2 BASCULANTE",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Manutenção de vias urbanas e rurais",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 52100,
      isPilot: true,
    },
    {
      fleetCode: "ONB-02",
      plate: "BWL1473",
      category: VehicleCategory.ONIBUS,
      brand: "Mercedes-Benz",
      model: "ONIBUS MERCEDES BENZ 0 371 R",
      year: 1991,
      fuelType: "Diesel",
      purpose: "Transporte escolar e coletivo",
      department: "Educação",
      criticality: Criticality.MEDIA,
      currentOdometer: 289400,
      isPilot: false,
    },
    {
      fleetCode: "ONB-03",
      plate: "BXF0G62",
      category: VehicleCategory.ONIBUS,
      brand: "Scania / Marcopolo",
      model: "ÔNIBUS M POLO PARADISO/SCANIA",
      year: 2004,
      fuelType: "Diesel",
      purpose: "Transporte universitário intermunicipal",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 341000,
      isPilot: false,
    },
    {
      fleetCode: "ONB-04",
      plate: "BXQ4228",
      category: VehicleCategory.ONIBUS,
      brand: "Mercedes-Benz / Caio",
      model: "M. BENZ/CAIO LD 916",
      year: 2018,
      fuelType: "Diesel",
      purpose: "Transporte Escolar Municipal",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 98400,
      isPilot: true,
    },
    {
      fleetCode: "EQP-01",
      plate: "BYR110",
      category: VehicleCategory.MAQUINA,
      brand: "CODEVAR",
      model: "Gerador Usina RCC CODEVAR",
      year: 2020,
      fuelType: "Diesel",
      purpose: "Alimentação de usina de reciclagem de entulho",
      department: "Meio Ambiente",
      criticality: Criticality.MEDIA,
      currentOdometer: 1420,
      isPilot: false,
    },
    {
      fleetCode: "CAM-05",
      plate: "CGF5G63",
      category: VehicleCategory.CAMINHAO,
      brand: "Iveco",
      model: "IVECO TECTOR 150 E 21",
      year: 2019,
      fuelType: "Diesel",
      purpose: "Transporte de cargas e apoio a serviços urbanos",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 86500,
      isPilot: false,
    },
    {
      fleetCode: "ONB-05",
      plate: "CMW8657",
      category: VehicleCategory.ONIBUS,
      brand: "Volare",
      model: "MICRO-ONIBUS VOLARE V6 ON",
      year: 2005,
      fuelType: "Diesel",
      purpose: "Transporte de pacientes para consultas regionais",
      department: "Saúde",
      criticality: Criticality.MEDIA,
      currentOdometer: 245000,
      isPilot: false,
    },
    {
      fleetCode: "VAN-01",
      plate: "CZA4157",
      category: VehicleCategory.VAN,
      brand: "Kia",
      model: "VAN BESTA",
      year: 2001,
      fuelType: "Diesel",
      purpose: "Transporte de equipes e apoio geral",
      department: "Administração Geral",
      criticality: Criticality.BAIXA,
      currentOdometer: 268000,
      isPilot: false,
    },
    {
      fleetCode: "ONB-06",
      plate: "CZA4160",
      category: VehicleCategory.ONIBUS,
      brand: "Marcopolo / Volare",
      model: "MICRO-ONIBUS MARCOPOLO VOLARE A6 ON",
      year: 2004,
      fuelType: "Diesel",
      purpose: "Transporte social e projetos comunitários",
      department: "Assistência Social",
      criticality: Criticality.MEDIA,
      currentOdometer: 231000,
      isPilot: false,
    },
    {
      fleetCode: "VAN-02",
      plate: "CZA4162",
      category: VehicleCategory.VAN,
      brand: "Peugeot",
      model: "VAN BOXER PEUGEOT M330M",
      year: 2005,
      fuelType: "Diesel",
      purpose: "Transporte de insumos e equipes de saúde",
      department: "Saúde",
      criticality: Criticality.MEDIA,
      currentOdometer: 219000,
      isPilot: false,
    },
    {
      fleetCode: "ONB-07",
      plate: "DJM1B54",
      category: VehicleCategory.ONIBUS,
      brand: "Mercedes-Benz / Induscar",
      model: "MICRO-ONIBUS MERCEDES BENZ INDUSCAR ATILIS 0",
      year: 2009,
      fuelType: "Diesel",
      purpose: "Transporte escolar municipal",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 178000,
      isPilot: false,
    },
    {
      fleetCode: "ONB-08",
      plate: "DJM7J51",
      category: VehicleCategory.ONIBUS,
      brand: "Mascarello",
      model: "MICRO-ONIBUS MASCA GRANMINI O",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Transporte Escolar Zona Rural",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 142300,
      isPilot: true,
    },
    {
      fleetCode: "CAM-06",
      plate: "DK10442",
      category: VehicleCategory.CAMINHAO,
      brand: "Mercedes-Benz",
      model: "CAMINHÃO BASCULANTE",
      year: 2009,
      fuelType: "Diesel",
      purpose: "Serviços urbanos e obras viárias",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 198000,
      isPilot: false,
    },
    {
      fleetCode: "AMB-01",
      plate: "DK10446",
      category: VehicleCategory.AMBULANCIA,
      brand: "Renault",
      model: "VAN RENAULT MASTERAMB RO",
      year: 2010,
      fuelType: "Diesel",
      purpose: "Remoção de pacientes e urgência",
      department: "Saúde",
      criticality: Criticality.CRITICA,
      currentOdometer: 189000,
      isPilot: false,
    },
    {
      fleetCode: "ONB-09",
      plate: "DK10453",
      category: VehicleCategory.ONIBUS,
      brand: "Volare",
      model: "MICRO-ONIBUS VOLARE V8L 4X4 EO",
      year: 2012,
      fuelType: "Diesel",
      purpose: "Transporte escolar em rotas rurais 4x4",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 165000,
      isPilot: true,
    },
    {
      fleetCode: "CAM-07",
      plate: "DK10458",
      category: VehicleCategory.CAMINHAO,
      brand: "Ford",
      model: "FORD CARGO CAMINHAO POLIGUINDASTE",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Coleta e troca de caçambas de entulho",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 138000,
      isPilot: false,
    },
    {
      fleetCode: "VAN-03",
      plate: "EEF9418",
      category: VehicleCategory.VAN,
      brand: "Renault",
      model: "VAN RENAULT MASTER",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Transporte sanitário de pacientes (TFD)",
      department: "Saúde",
      criticality: Criticality.ALTA,
      currentOdometer: 147500,
      isPilot: false,
    },
    {
      fleetCode: "CAM-08",
      plate: "ENE7D83",
      category: VehicleCategory.CAMINHAO,
      brand: "Iveco",
      model: "IVECO/TECTOR 240E28 ATTACK",
      year: 2019,
      fuelType: "Diesel",
      purpose: "Manutenção de estradas e obras de infraestrutura",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 89300,
      isPilot: true,
    },
    {
      fleetCode: "ONB-10",
      plate: "EXP0A37",
      category: VehicleCategory.ONIBUS,
      brand: "Mercedes-Benz / Marcopolo",
      model: "ONIBUS MB MARCOPOLO PARADISO G6",
      year: 2000,
      fuelType: "Diesel",
      purpose: "Transporte estudantil intermunicipal",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 395000,
      isPilot: false,
    },
    {
      fleetCode: "AMB-02",
      plate: "FAY8942",
      category: VehicleCategory.AMBULANCIA,
      brand: "Renault",
      model: "RENAULT MASTER - AMBULANCIA",
      year: 2016,
      fuelType: "Diesel",
      purpose: "Atendimento de urgência e suporte básico",
      department: "Saúde",
      criticality: Criticality.CRITICA,
      currentOdometer: 128400,
      isPilot: true,
    },
    {
      fleetCode: "AMB-03",
      plate: "FFE3191",
      category: VehicleCategory.AMBULANCIA,
      brand: "Mercedes-Benz",
      model: "MERCEDES SPRINTER AMBULANCIA",
      year: 2018,
      fuelType: "Diesel",
      purpose: "UTI Móvel e transferências de alta complexidade",
      department: "Saúde",
      criticality: Criticality.CRITICA,
      currentOdometer: 112000,
      isPilot: true,
    },
    {
      fleetCode: "ONB-11",
      plate: "FMX9614",
      category: VehicleCategory.ONIBUS,
      brand: "Marcopolo / Volare",
      model: "MICRO-ONIBUS MARCOPOLO VOLARE V6L",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Transporte escolar municipal",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 134000,
      isPilot: false,
    },
    {
      fleetCode: "ONB-12",
      plate: "FOE5G36",
      category: VehicleCategory.ONIBUS,
      brand: "Volare",
      model: "MICRO-ONIBUS VOLARE V6L EM",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Transporte de estudantes",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 129800,
      isPilot: false,
    },
    {
      fleetCode: "CAM-09",
      plate: "FQH5442",
      category: VehicleCategory.CAMINHAO,
      brand: "International",
      model: "CAMINHÃO BASCULANTE 4400P 6X4",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Obras pesadas e pavimentação asfáltica",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 154000,
      isPilot: false,
    },
    {
      fleetCode: "CAM-10",
      plate: "FRB1141",
      category: VehicleCategory.CAMINHAO,
      brand: "Volkswagen",
      model: "VW 14.190 CRM 4X2 COLETA SELETIVA",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Coleta seletiva e gestão de resíduos",
      department: "Meio Ambiente",
      criticality: Criticality.CRITICA,
      currentOdometer: 41200,
      isPilot: true,
    },
    {
      fleetCode: "CAR-01",
      plate: "FVO7F12",
      category: VehicleCategory.CARRO,
      brand: "Mitsubishi",
      model: "MMC/L200 TRITON SPO GL",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Fiscalização de obras e vistorias de campo",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 54300,
      isPilot: true,
    },
    {
      fleetCode: "AMB-04",
      plate: "FWE7A15",
      category: VehicleCategory.AMBULANCIA,
      brand: "Renault",
      model: "RENAULT MASTERF2 REV AMBULANCIA",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Atendimento de urgência e pronto atendimento",
      department: "Saúde",
      criticality: Criticality.CRITICA,
      currentOdometer: 46800,
      isPilot: true,
    },
    {
      fleetCode: "AMB-05",
      plate: "FYV9E24",
      category: VehicleCategory.AMBULANCIA,
      brand: "Renault",
      model: "RENAULT/MASTERF2 REV AMB",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Suporte básico e pronto socorro",
      department: "Saúde",
      criticality: Criticality.CRITICA,
      currentOdometer: 43500,
      isPilot: true,
    },
    {
      fleetCode: "CAM-11",
      plate: "FZL0F43",
      category: VehicleCategory.CAMINHAO,
      brand: "Iveco",
      model: "CAMINHAO BASCULANTE IVECO TECTOR 240E28",
      year: 2020,
      fuelType: "Diesel",
      purpose: "Obras, pontes e estradas rurais",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 72400,
      isPilot: true,
    },
    {
      fleetCode: "ONB-13",
      plate: "GAA1D46",
      category: VehicleCategory.ONIBUS,
      brand: "Volkswagen",
      model: "ONIBUS TR ESCOLAR VW 15.190",
      year: 2020,
      fuelType: "Diesel",
      purpose: "Transporte Escolar Municipal",
      department: "Educação",
      criticality: Criticality.CRITICA,
      currentOdometer: 67800,
      isPilot: true,
    },
    {
      fleetCode: "ONB-14",
      plate: "GAA4E51",
      category: VehicleCategory.ONIBUS,
      brand: "Volkswagen",
      model: "VW15.190 EQD E HD ORE",
      year: 2020,
      fuelType: "Diesel",
      purpose: "Transporte Escolar (ORE)",
      department: "Educação",
      criticality: Criticality.CRITICA,
      currentOdometer: 64200,
      isPilot: true,
    },
    {
      fleetCode: "CAM-12",
      plate: "GFI9A75",
      category: VehicleCategory.CAMINHAO,
      brand: "Iveco",
      model: "IVECO/TECTOR 11-190",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Transporte de insumos e manutenção urbana",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 38900,
      isPilot: false,
    },
    {
      fleetCode: "AMB-06",
      plate: "GJB6C95",
      category: VehicleCategory.AMBULANCIA,
      brand: "Renault",
      model: "AMBULANCIA RENALUT GRAND FURGÃO L2H2",
      year: 2021,
      fuelType: "Diesel",
      purpose: "Ambulância de suporte avançado",
      department: "Saúde",
      criticality: Criticality.CRITICA,
      currentOdometer: 58200,
      isPilot: true,
    },
    {
      fleetCode: "CAM-13",
      plate: "GVK8267",
      category: VehicleCategory.CAMINHAO,
      brand: "Mercedes-Benz",
      model: "CAMINHÃO PIPA",
      year: 1971,
      fuelType: "Diesel",
      purpose: "Abastecimento de água e lavagem de logradouros",
      department: "Obras e Meio Ambiente",
      criticality: Criticality.MEDIA,
      currentOdometer: 298000,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-01",
      plate: "JCB0000",
      category: VehicleCategory.MAQUINA,
      brand: "JCB",
      model: "RETROESCAVADEIRA JCB",
      year: 2025,
      fuelType: "Diesel",
      purpose: "Abertura de valas, drenagem e terraplanagem",
      department: "Obras e Agricultura",
      criticality: Criticality.CRITICA,
      currentOdometer: 420,
      isPilot: true,
    },
    {
      fleetCode: "MAQ-02",
      plate: "JP80",
      category: VehicleCategory.MAQUINA,
      brand: "LS Tractor",
      model: "TRATOR LS TIPO U080",
      year: 2018,
      fuelType: "Diesel",
      purpose: "Patrulha agrícola e serviços rurais",
      department: "Agricultura",
      criticality: Criticality.MEDIA,
      currentOdometer: 2450,
      isPilot: false,
    },
    {
      fleetCode: "ONB-15",
      plate: "KOD2T23",
      category: VehicleCategory.ONIBUS,
      brand: "Scania",
      model: "ONIBUS SCANIA 113 CL 4X2 320",
      year: 1996,
      fuelType: "Diesel",
      purpose: "Transporte intermunicipal de estudantes",
      department: "Educação",
      criticality: Criticality.ALTA,
      currentOdometer: 420000,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-03",
      plate: "KW20-E",
      category: VehicleCategory.MAQUINA,
      brand: "Case",
      model: "PA-CARREGADEIRA KASE W-20E",
      year: 2009,
      fuelType: "Diesel",
      purpose: "Carregamento de agregados e bota-fora",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 6800,
      isPilot: false,
    },
    {
      fleetCode: "EQP-02",
      plate: "LPG 150",
      category: VehicleCategory.MAQUINA,
      brand: "Stemac",
      model: "GRUPO GERADOR 150 KVA",
      year: 2020,
      fuelType: "Diesel",
      purpose: "Energia de emergência para unidades públicas",
      department: "Infraestrutura",
      criticality: Criticality.MEDIA,
      currentOdometer: 890,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-04",
      plate: "MF 265",
      category: VehicleCategory.MAQUINA,
      brand: "Massey Ferguson",
      model: "TRATOR MASSEY FERGUSON 265",
      year: 1978,
      fuelType: "Diesel",
      purpose: "Roçagem de pastagens e estradas rurais",
      department: "Agricultura",
      criticality: Criticality.BAIXA,
      currentOdometer: 8400,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-05",
      plate: "MF 5710",
      category: VehicleCategory.MAQUINA,
      brand: "Massey Ferguson",
      model: "TRATOR MASSEY FERGUSON 105CV MF5710C 4CYL",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Patrulha agrícola e preparo de solo",
      department: "Agricultura",
      criticality: Criticality.ALTA,
      currentOdometer: 1650,
      isPilot: true,
    },
    {
      fleetCode: "MAQ-06",
      plate: "MN-140B",
      category: VehicleCategory.MAQUINA,
      brand: "New Holland",
      model: "MOTO NIVELADORA R 140.B NEW HOLLAND",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Nivelamento e conservação de estradas rurais",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.CRITICA,
      currentOdometer: 5200,
      isPilot: true,
    },
    {
      fleetCode: "MAQ-07",
      plate: "PC935-H",
      category: VehicleCategory.MAQUINA,
      brand: "Combat",
      model: "PA-CARREGADEIRA COMBAT 935 H",
      year: 2010,
      fuelType: "Diesel",
      purpose: "Terraplanagem e carregamento de entulho",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 6100,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-08",
      plate: "RET-100",
      category: VehicleCategory.MAQUINA,
      brand: "Maxxiom",
      model: "RETRO-ESCAVADEIRA MAXXIOM 100BH",
      year: 2012,
      fuelType: "Diesel",
      purpose: "Escavações para redes de água e esgoto",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 5900,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-09",
      plate: "RET-200",
      category: VehicleCategory.MAQUINA,
      brand: "JCB",
      model: "RETRO-ESCAVADEIRA JCB",
      year: 2014,
      fuelType: "Diesel",
      purpose: "Manutenção urbana e limpeza de córregos",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 5400,
      isPilot: false,
    },
    {
      fleetCode: "CAM-14",
      plate: "SCE4H74",
      category: VehicleCategory.CAMINHAO,
      brand: "Mercedes-Benz",
      model: "CAMINHÃO BOMBEIRO",
      year: 2018,
      fuelType: "Diesel",
      purpose: "Combate a incêndios e apoio à Defesa Civil",
      department: "Defesa Civil",
      criticality: Criticality.CRITICA,
      currentOdometer: 38200,
      isPilot: false,
    },
    {
      fleetCode: "VAN-04",
      plate: "SUR6C34",
      category: VehicleCategory.VAN,
      brand: "Citroën",
      model: "VAN CITROEN",
      year: 2019,
      fuelType: "Diesel",
      purpose: "Transporte de pacientes para consultas especializadas",
      department: "Saúde",
      criticality: Criticality.ALTA,
      currentOdometer: 87400,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-10",
      plate: "T4100",
      category: VehicleCategory.MAQUINA,
      brand: "Agrale",
      model: "TRATOR AGRALE",
      year: 2012,
      fuelType: "Diesel",
      purpose: "Roçagem de praças e áreas verdes",
      department: "Meio Ambiente",
      criticality: Criticality.BAIXA,
      currentOdometer: 4100,
      isPilot: false,
    },
    {
      fleetCode: "AMB-07",
      plate: "TKM9G62",
      category: VehicleCategory.AMBULANCIA,
      brand: "Renault",
      model: "RENAULT MASTER - SAMU NOVA",
      year: 2024,
      fuelType: "Diesel",
      purpose: "Atendimento móvel de urgência SAMU 192",
      department: "Saúde",
      criticality: Criticality.CRITICA,
      currentOdometer: 14500,
      isPilot: true,
    },
    {
      fleetCode: "MAQ-11",
      plate: "TS6020",
      category: VehicleCategory.MAQUINA,
      brand: "New Holland",
      model: "TRATOR NEW HOLAND TS6020",
      year: 2011,
      fuelType: "Diesel",
      purpose: "Patrulha agrícola e suporte a produtores",
      department: "Agricultura",
      criticality: Criticality.MEDIA,
      currentOdometer: 5100,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-12",
      plate: "TT4030",
      category: VehicleCategory.MAQUINA,
      brand: "New Holland",
      model: "TRATOR NEW HOLAND TT4030",
      year: 2012,
      fuelType: "Diesel",
      purpose: "Serviços agrícolas e manutenção rural",
      department: "Agricultura",
      criticality: Criticality.MEDIA,
      currentOdometer: 4750,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-13",
      plate: "TT7630",
      category: VehicleCategory.MAQUINA,
      brand: "New Holland",
      model: "TRATOR NEW HOLLAND TT-7630",
      year: 2020,
      fuelType: "Diesel",
      purpose: "Preparo de solo e conservação de estradas",
      department: "Agricultura",
      criticality: Criticality.ALTA,
      currentOdometer: 2300,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-14",
      plate: "XC870BR",
      category: VehicleCategory.MAQUINA,
      brand: "XCMG",
      model: "RETROESCAVADEIRA XCMG",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Obras de infraestrutura urbana e drenagem",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 1850,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-15",
      plate: "XT870BR",
      category: VehicleCategory.MAQUINA,
      brand: "XCMG",
      model: "RETRO ESCAVADEIRA XCMG XTR870BR-1",
      year: 2022,
      fuelType: "Diesel",
      purpose: "Obras públicas e abertura de canais",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.ALTA,
      currentOdometer: 1720,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-16",
      plate: "XUG0300",
      category: VehicleCategory.MAQUINA,
      brand: "XCMG",
      model: "PÅ CARREGADEIRA XCMG MOD LW300 KV",
      year: 2021,
      fuelType: "Diesel",
      purpose: "Carregamento de caminhões basculantes",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.CRITICA,
      currentOdometer: 2800,
      isPilot: false,
    },

    // -------------------------------------------------------------------------
    // GRUPO: ETANOL (1 ATIVO)
    // -------------------------------------------------------------------------
    {
      fleetCode: "CAR-02",
      plate: "TIR0D67",
      category: VehicleCategory.CARRO,
      brand: "Toyota",
      model: "COROLA CROSSA",
      year: 2025,
      fuelType: "Etanol",
      purpose: "Representação oficial e viagens do Gabinete",
      department: "Gabinete do Prefeito",
      criticality: Criticality.ALTA,
      currentOdometer: 8500,
      isPilot: true,
    },

    // -------------------------------------------------------------------------
    // GRUPO: FLEX (18 ATIVOS)
    // -------------------------------------------------------------------------
    {
      fleetCode: "CAR-03",
      plate: "BYG5878",
      category: VehicleCategory.CARRO,
      brand: "Volkswagen",
      model: "VW/VOYAGE 1.6 L MB5",
      year: 2019,
      fuelType: "Flex",
      purpose: "Atendimento administrativo e serviços de secretaria",
      department: "Administração Geral",
      criticality: Criticality.MEDIA,
      currentOdometer: 74200,
      isPilot: false,
    },
    {
      fleetCode: "CAR-04",
      plate: "DBA9892",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT UNO",
      year: 2010,
      fuelType: "Flex",
      purpose: "Apoio operacional e pequenos deslocamentos",
      department: "Serviços Gerais",
      criticality: Criticality.BAIXA,
      currentOdometer: 145000,
      isPilot: false,
    },
    {
      fleetCode: "CAR-05",
      plate: "DJP8432",
      category: VehicleCategory.CARRO,
      brand: "Fiat / Rontan",
      model: "DOBLO RONTAN OBRAS",
      year: 2008,
      fuelType: "Flex",
      purpose: "Fiscalização de obras públicas",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 168000,
      isPilot: false,
    },
    {
      fleetCode: "VAN-05",
      plate: "DK10449",
      category: VehicleCategory.VAN,
      brand: "Volkswagen",
      model: "KOMBI",
      year: 2012,
      fuelType: "Flex",
      purpose: "Transporte de apoio escolar e materiais",
      department: "Educação",
      criticality: Criticality.MEDIA,
      currentOdometer: 141000,
      isPilot: false,
    },
    {
      fleetCode: "VAN-06",
      plate: "DK10451",
      category: VehicleCategory.VAN,
      brand: "Volkswagen",
      model: "KOMBI",
      year: 2012,
      fuelType: "Flex",
      purpose: "Distribuição de merenda escolar e suprimentos",
      department: "Educação",
      criticality: Criticality.MEDIA,
      currentOdometer: 139500,
      isPilot: false,
    },
    {
      fleetCode: "CAR-06",
      plate: "DK10E52",
      category: VehicleCategory.CARRO,
      brand: "Volkswagen",
      model: "VOYAGE",
      year: 2012,
      fuelType: "Flex",
      purpose: "Serviços administrativos e viagens técnicas",
      department: "Administração Geral",
      criticality: Criticality.MEDIA,
      currentOdometer: 126000,
      isPilot: false,
    },
    {
      fleetCode: "CAR-07",
      plate: "DLM7C01",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "Mobi Procon",
      year: 2021,
      fuelType: "Flex",
      purpose: "Fiscalização e atendimento ao consumidor PROCON",
      department: "PROCON",
      criticality: Criticality.MEDIA,
      currentOdometer: 36400,
      isPilot: false,
    },
    {
      fleetCode: "CAR-08",
      plate: "FBM3F12",
      category: VehicleCategory.CARRO,
      brand: "Chevrolet",
      model: "S-10 LS FS2 PICK-UP",
      year: 2012,
      fuelType: "Flex",
      purpose: "Vistorias rurais e apoio técnico agrícola",
      department: "Agricultura",
      criticality: Criticality.MEDIA,
      currentOdometer: 153000,
      isPilot: false,
    },
    {
      fleetCode: "CAR-09",
      plate: "FCA8423",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT MOBI",
      year: 2017,
      fuelType: "Flex",
      purpose: "Visitas domiciliares de assistência social",
      department: "Assistência Social",
      criticality: Criticality.MEDIA,
      currentOdometer: 89500,
      isPilot: false,
    },
    {
      fleetCode: "CAR-10",
      plate: "FKQ7A85",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT STRADA",
      year: 2018,
      fuelType: "Flex",
      purpose: "Manutenção de praças e serviços urbanos",
      department: "Serviços Urbanos",
      criticality: Criticality.MEDIA,
      currentOdometer: 94200,
      isPilot: false,
    },
    {
      fleetCode: "CAR-11",
      plate: "FMS0G37",
      category: VehicleCategory.CARRO,
      brand: "Chevrolet",
      model: "CHEVROLET/SPIN 1.8 AT PREMIER",
      year: 2021,
      fuelType: "Flex",
      purpose: "Transporte de pacientes em tratamento fora do domicílio (TFD)",
      department: "Saúde",
      criticality: Criticality.ALTA,
      currentOdometer: 62400,
      isPilot: true,
    },
    {
      fleetCode: "CAR-12",
      plate: "FOM3J26",
      category: VehicleCategory.CARRO,
      brand: "Chevrolet",
      model: "SPIN AT ACTV7 1.8 FLEX",
      year: 2021,
      fuelType: "Flex",
      purpose: "Transporte de equipes médicas e pacientes",
      department: "Saúde",
      criticality: Criticality.ALTA,
      currentOdometer: 59800,
      isPilot: true,
    },
    {
      fleetCode: "CAR-13",
      plate: "FSP1C81",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "Strada assis.social",
      year: 2020,
      fuelType: "Flex",
      purpose: "Atendimento social e distribuição de benefícios",
      department: "Assistência Social",
      criticality: Criticality.MEDIA,
      currentOdometer: 47200,
      isPilot: false,
    },
    {
      fleetCode: "CAR-14",
      plate: "FWU9J31",
      category: VehicleCategory.CARRO,
      brand: "Chevrolet",
      model: "SPIN 3 1.8L AT ACT7",
      year: 2021,
      fuelType: "Flex",
      purpose: "Transporte sanitário e equipes do PSF",
      department: "Saúde",
      criticality: Criticality.ALTA,
      currentOdometer: 56100,
      isPilot: false,
    },
    {
      fleetCode: "CAR-15",
      plate: "FYW1J84",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT FASTBACK LIMITED EDITION",
      year: 2023,
      fuelType: "Flex",
      purpose: "Gabinete e viagens oficiais institucionais",
      department: "Gabinete do Prefeito",
      criticality: Criticality.ALTA,
      currentOdometer: 24800,
      isPilot: true,
    },
    {
      fleetCode: "CAR-16",
      plate: "GEA5330",
      category: VehicleCategory.CARRO,
      brand: "Chevrolet",
      model: "CORSA CLASSIC",
      year: 2015,
      fuelType: "Flex",
      purpose: "Serviços administrativos e malotes municipais",
      department: "Administração Geral",
      criticality: Criticality.BAIXA,
      currentOdometer: 118000,
      isPilot: false,
    },
    {
      fleetCode: "CAR-17",
      plate: "MIE7537",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT UNO",
      year: 2010,
      fuelType: "Flex",
      purpose: "Fiscalização de posturas e rondas urbanas",
      department: "Serviços Gerais",
      criticality: Criticality.BAIXA,
      currentOdometer: 152000,
      isPilot: false,
    },
    {
      fleetCode: "CAR-18",
      plate: "TIR0D65",
      category: VehicleCategory.CARRO,
      brand: "Toyota",
      model: "TOYOTA COROLLA CROSS XRX",
      year: 2025,
      fuelType: "Flex",
      purpose: "Gabinete e representação oficial do município",
      department: "Gabinete do Prefeito",
      criticality: Criticality.ALTA,
      currentOdometer: 7900,
      isPilot: true,
    },

    // -------------------------------------------------------------------------
    // GRUPO: GASOLINA (19 ATIVOS)
    // -------------------------------------------------------------------------
    {
      fleetCode: "EQP-03",
      plate: "B4T3500",
      category: VehicleCategory.MAQUINA,
      brand: "Branco",
      model: "GERADOR BRANCO B4T3500 P MAN",
      year: 2021,
      fuelType: "Gasolina",
      purpose: "Alimentação de ferramentas elétricas em obras",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 620,
      isPilot: false,
    },
    {
      fleetCode: "MOT-01",
      plate: "B4T65H",
      category: VehicleCategory.MOTOCICLETA,
      brand: "Honda / Branco",
      model: "Moto Branco defesa civil",
      year: 2020,
      fuelType: "Gasolina",
      purpose: "Vistorias rápidas e monitoramento Defesa Civil",
      department: "Defesa Civil",
      criticality: Criticality.MEDIA,
      currentOdometer: 18400,
      isPilot: false,
    },
    {
      fleetCode: "AMB-08",
      plate: "BOB7803",
      category: VehicleCategory.AMBULANCIA,
      brand: "Fiat / Revescap",
      model: "FIAT FIORINO /REVESCAP AMB. SR",
      year: 2018,
      fuelType: "Gasolina",
      purpose: "Remoção simples e transferências locais",
      department: "Saúde",
      criticality: Criticality.ALTA,
      currentOdometer: 89000,
      isPilot: false,
    },
    {
      fleetCode: "EQP-04",
      plate: "BR420",
      category: VehicleCategory.OUTRO,
      brand: "Stihl",
      model: "SOPRADOR COSTAL BR420 STHIL",
      year: 2022,
      fuelType: "Gasolina",
      purpose: "Varrição e limpeza de folhas em praças",
      department: "Meio Ambiente",
      criticality: Criticality.BAIXA,
      currentOdometer: 310,
      isPilot: false,
    },
    {
      fleetCode: "CAR-19",
      plate: "CDV1411",
      category: VehicleCategory.CARRO,
      brand: "Chevrolet / Rontan",
      model: "S-10 RONTAN VIGILANCIA EPIDEMIOLOGICA",
      year: 2002,
      fuelType: "Gasolina",
      purpose: "Ações de combate à dengue e vigilância sanitária",
      department: "Vigilância Epidemiológica",
      criticality: Criticality.MEDIA,
      currentOdometer: 215000,
      isPilot: false,
    },
    {
      fleetCode: "MOT-02",
      plate: "DET4311",
      category: VehicleCategory.MOTOCICLETA,
      brand: "Kasinski",
      model: "MOTOCICLETA KASINSKI",
      year: 2011,
      fuelType: "Gasolina",
      purpose: "Entrega de notificações e malotes rápidos",
      department: "Finanças e Tributação",
      criticality: Criticality.BAIXA,
      currentOdometer: 48900,
      isPilot: false,
    },
    {
      fleetCode: "CAR-20",
      plate: "DJP2955",
      category: VehicleCategory.CARRO,
      brand: "Chevrolet",
      model: "MONTANA 1.8 PICK UP OBRAS",
      year: 2005,
      fuelType: "Gasolina",
      purpose: "Transporte rápido de materiais e ferramentas de obras",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 187000,
      isPilot: false,
    },
    {
      fleetCode: "CAR-21",
      plate: "DMG5172",
      category: VehicleCategory.CARRO,
      brand: "Volkswagen",
      model: "VW/VOYAGE 1.6 L MB5",
      year: 2019,
      fuelType: "Gasolina",
      purpose: "Serviços administrativos externos",
      department: "Administração Geral",
      criticality: Criticality.MEDIA,
      currentOdometer: 81200,
      isPilot: false,
    },
    {
      fleetCode: "EQP-05",
      plate: "FOG",
      category: VehicleCategory.OUTRO,
      brand: "Branco",
      model: "MOTO BOMBA",
      year: 2019,
      fuelType: "Gasolina",
      purpose: "Esgotamento de água e emergências pluviais",
      department: "Defesa Civil",
      criticality: Criticality.MEDIA,
      currentOdometer: 450,
      isPilot: false,
    },
    {
      fleetCode: "CAR-22",
      plate: "FOM5136",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT MOBI LIKE",
      year: 2017,
      fuelType: "Gasolina",
      purpose: "Visitas domiciliares de enfermagem (ESF)",
      department: "Saúde",
      criticality: Criticality.MEDIA,
      currentOdometer: 76500,
      isPilot: false,
    },
    {
      fleetCode: "EQP-06",
      plate: "GTS 35",
      category: VehicleCategory.OUTRO,
      brand: "Guarany",
      model: "TERMONEBULIZADOR GUARANY GTS 35 A",
      year: 2019,
      fuelType: "Gasolina",
      purpose: "Aplicação espacial de inseticida contra o mosquito da dengue",
      department: "Vigilância Epidemiológica",
      criticality: Criticality.ALTA,
      currentOdometer: 580,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-17",
      plate: "MCA250",
      category: VehicleCategory.MAQUINA,
      brand: "Motocar",
      model: "MOTOCAR MCA 250 EQUIP SINALIZACAO HORIZONTAL",
      year: 2017,
      fuelType: "Gasolina",
      purpose: "Pintura e demarcação de sinalização viária",
      department: "Trânsito e Vias Públicas",
      criticality: Criticality.MEDIA,
      currentOdometer: 12400,
      isPilot: false,
    },
    {
      fleetCode: "CAR-23",
      plate: "MIE5737",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT UNO",
      year: 2010,
      fuelType: "Gasolina",
      purpose: "Suporte operacional a prédios públicos",
      department: "Serviços Gerais",
      criticality: Criticality.BAIXA,
      currentOdometer: 161000,
      isPilot: false,
    },
    {
      fleetCode: "EQP-07",
      plate: "MM PODA",
      category: VehicleCategory.OUTRO,
      brand: "Stihl",
      model: "MOTO PODA STHIL",
      year: 2011,
      fuelType: "Gasolina",
      purpose: "Poda preventiva de árvores e desobstrução",
      department: "Meio Ambiente",
      criticality: Criticality.MEDIA,
      currentOdometer: 890,
      isPilot: false,
    },
    {
      fleetCode: "MAQ-18",
      plate: "PV001",
      category: VehicleCategory.MAQUINA,
      brand: "CSM",
      model: "PLACA VIBRATORIA",
      year: 2020,
      fuelType: "Gasolina",
      purpose: "Compactação de asfalto frio e recomposição de pavimentos",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 740,
      isPilot: false,
    },
    {
      fleetCode: "MOT-03",
      plate: "RCK",
      category: VehicleCategory.MOTOCICLETA,
      brand: "Rocket",
      model: "BICICLETA MOTORIZADA ROCKET",
      year: 2023,
      fuelType: "Gasolina",
      purpose: "Fiscalização em praças e ciclovias",
      department: "Fiscalização Urbana",
      criticality: Criticality.BAIXA,
      currentOdometer: 4200,
      isPilot: false,
    },
    {
      fleetCode: "CAR-24",
      plate: "SVW4D69",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "FIAT STRADA DEFESA CIVIL",
      year: 2023,
      fuelType: "Gasolina",
      purpose: "Vistorias de risco e emergências da Defesa Civil",
      department: "Defesa Civil",
      criticality: Criticality.ALTA,
      currentOdometer: 29800,
      isPilot: true,
    },
    {
      fleetCode: "CAR-25",
      plate: "TKJ5H87",
      category: VehicleCategory.CARRO,
      brand: "Fiat",
      model: "STRADA",
      year: 2025,
      fuelType: "Gasolina",
      purpose: "Fiscalização de obras e apoio operacional",
      department: "Obras e Serviços Públicos",
      criticality: Criticality.MEDIA,
      currentOdometer: 9200,
      isPilot: true,
    },
    {
      fleetCode: "MAQ-19",
      plate: "TRG-01",
      category: VehicleCategory.MAQUINA,
      brand: "Vermeer",
      model: "TRITURADOR DE GALHOS VERMEER",
      year: 2021,
      fuelType: "Gasolina",
      purpose: "Trituração de resíduos de poda para compostagem",
      department: "Meio Ambiente",
      criticality: Criticality.MEDIA,
      currentOdometer: 1150,
      isPilot: false,
    },
  ];

  console.log(`⏳ Cadastrando os ${initialFleet.length} veículos da frota municipal...`);

  const createdVehicles: Record<string, any> = {};

  for (const v of initialFleet) {
    const vehicle = await prisma.vehicle.upsert({
      where: {
        tenantId_plate: {
          tenantId: tenant.id,
          plate: v.plate,
        },
      },
      update: {
        fleetCode: v.fleetCode,
        category: v.category,
        brand: v.brand,
        model: v.model,
        year: v.year,
        fuelType: v.fuelType,
        purpose: v.purpose,
        department: v.department,
        criticality: v.criticality,
        status: VehicleStatus.ATIVO,
        currentOdometer: v.currentOdometer,
        isPilot: v.isPilot,
        active: true,
      },
      create: {
        tenantId: tenant.id,
        fleetCode: v.fleetCode,
        plate: v.plate,
        category: v.category,
        brand: v.brand,
        model: v.model,
        year: v.year,
        fuelType: v.fuelType,
        purpose: v.purpose,
        department: v.department,
        criticality: v.criticality,
        status: VehicleStatus.ATIVO,
        currentOdometer: v.currentOdometer,
        isPilot: v.isPilot,
        active: true,
      },
    });

    createdVehicles[v.plate] = vehicle;

    // Vincular ao plano preventivo da categoria se existir
    const matchingPlanId = planIdByCategory[v.category];
    if (matchingPlanId) {
      await prisma.vehiclePreventivePlan.upsert({
        where: {
          vehicleId_planId: {
            vehicleId: vehicle.id,
            planId: matchingPlanId,
          },
        },
        update: { active: true },
        create: {
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          planId: matchingPlanId,
          active: true,
        },
      });
    }

    // Registrar leitura inicial de hodômetro se não houver nenhuma
    const hasOdometer = await prisma.odometerReading.findFirst({
      where: { vehicleId: vehicle.id },
    });

    if (!hasOdometer) {
      await prisma.odometerReading.create({
        data: {
          tenantId: tenant.id,
          vehicleId: vehicle.id,
          userId: adminUser.id,
          reading: v.currentOdometer,
          source: OdometerSource.IMPORTACAO,
          readingDate: new Date("2025-01-31T10:00:00Z"),
          notes: "Leitura base registrada no Inventário e Diagnóstico da Frota (Mês 1)",
        },
      });
    }
  }

  console.log(`✅ Todos os ${initialFleet.length} veículos cadastrados com planos e hodômetros iniciais`);

  // 9. Grupo Piloto Operacional (Mês 3 — Operação Controlada)
  const pilotVehicles = initialFleet.filter((v) => v.isPilot);
  
  let pilotGroup = await prisma.pilotGroup.findFirst({
    where: {
      tenantId: tenant.id,
      name: "Grupo Piloto — Operação Controlada M3",
    },
  });

  if (!pilotGroup) {
    pilotGroup = await prisma.pilotGroup.create({
      data: {
        tenantId: tenant.id,
        name: "Grupo Piloto — Operação Controlada M3",
        startDate: new Date("2025-03-01T00:00:00Z"),
        status: "ATIVO",
        notes: "Veículos prioritários selecionados para o início das rotinas de preventiva e checklists diários",
      },
    });
  }

  for (const pv of pilotVehicles) {
    const dbVehicle = createdVehicles[pv.plate];
    if (dbVehicle && pilotGroup) {
      await prisma.pilotGroupVehicle.upsert({
        where: {
          groupId_vehicleId: {
            groupId: pilotGroup.id,
            vehicleId: dbVehicle.id,
          },
        },
        update: { active: true },
        create: {
          tenantId: tenant.id,
          groupId: pilotGroup.id,
          vehicleId: dbVehicle.id,
          active: true,
        },
      });
    }
  }
  console.log(`✅ Grupo Piloto estruturado com ${pilotVehicles.length} veículos prioritários`);

  // 10. Atribuição de Motorista a Veículos Piloto Principais
  const assignedPlates = ["BSZ6C24", "FFE3191", "BVT5163", "TIR0D65"];
  for (const plate of assignedPlates) {
    const v = createdVehicles[plate];
    if (v) {
      await prisma.vehicleAssignment.upsert({
        where: {
          vehicleId_userId: {
            vehicleId: v.id,
            userId: motoristaUser.id,
          },
        },
        update: { active: true },
        create: {
          tenantId: tenant.id,
          vehicleId: v.id,
          userId: motoristaUser.id,
          notes: "Condutor escalado para a rota da operação controlada",
        },
      });
    }
  }

  // 11. Dados Operacionais Iniciais (Checklists e Ordens de Serviço de Exemplo)
  const busVehicle = createdVehicles["BSZ6C24"]; // Ônibus Escolar
  const busTemplateId = templateIdByCategory[VehicleCategory.ONIBUS];

  if (busVehicle && busTemplateId) {
    const existingInspection = await prisma.inspection.findFirst({
      where: { vehicleId: busVehicle.id },
    });

    if (!existingInspection) {
      const templateItems = await prisma.checklistTemplateItem.findMany({
        where: { templateId: busTemplateId },
      });

      const inspection = await prisma.inspection.create({
        data: {
          tenantId: tenant.id,
          vehicleId: busVehicle.id,
          userId: motoristaUser.id,
          templateId: busTemplateId,
          odometer: busVehicle.currentOdometer + 250,
          status: InspectionAnswerStatus.OK,
          notes: "Inspeção matinal antes do início da rota rural escolar. Tudo em conformidade.",
          performedAt: new Date("2025-03-03T06:30:00Z"),
          answers: {
            create: templateItems.map((item) => ({
              tenantId: tenant.id,
              templateItemId: item.id,
              status: InspectionAnswerStatus.OK,
              notes: "Item checado e aprovado",
            })),
          },
        },
      });

      // Atualizar hodômetro atual
      await prisma.vehicle.update({
        where: { id: busVehicle.id },
        data: { currentOdometer: busVehicle.currentOdometer + 250 },
      });

      await prisma.odometerReading.create({
        data: {
          tenantId: tenant.id,
          vehicleId: busVehicle.id,
          userId: motoristaUser.id,
          reading: busVehicle.currentOdometer + 250,
          source: OdometerSource.CHECKLIST,
          readingDate: new Date("2025-03-03T06:30:00Z"),
          notes: "Leitura registrada via Checklist Operacional",
        },
      });
    }
  }

  // Criar Ordens de Serviço demonstrativas
  const ambVehicle = createdVehicles["FFE3191"]; // Mercedes Sprinter Ambulância
  if (ambVehicle) {
    const existingOrder = await prisma.maintenanceOrder.findFirst({
      where: { tenantId: tenant.id, orderNumber: "OS-2025-001" },
    });

    if (!existingOrder) {
      const ambPlanId = planIdByCategory[VehicleCategory.AMBULANCIA];
      const planItem = ambPlanId
        ? await prisma.preventivePlanItem.findFirst({ where: { planId: ambPlanId } })
        : null;

      await prisma.maintenanceOrder.create({
        data: {
          tenantId: tenant.id,
          vehicleId: ambVehicle.id,
          orderNumber: "OS-2025-001",
          type: MaintenanceType.PREVENTIVA,
          status: OrderStatus.CONCLUIDA,
          priority: Criticality.CRITICA,
          origin: "PLANO_PREVENTIVO",
          planId: ambPlanId,
          planItemId: planItem?.id,
          description: "Revisão Preventiva Programada — Troca de Óleo e Filtros da Ambulância UTI",
          diagnosis: "Serviço preventivo executado rigorosamente conforme cronograma de 10.000 km",
          openedAt: new Date("2025-03-01T08:00:00Z"),
          startedAt: new Date("2025-03-01T09:00:00Z"),
          completedAt: new Date("2025-03-01T14:30:00Z"),
          odometerAtOpen: 110000,
          odometerAtClose: 110000,
          partsCost: 650.0,
          laborCost: 280.0,
          totalCost: 930.0,
          providerName: "Auto Mecânica & Peças Central de Jaborandi",
          documentReference: "NF-84210",
          assignedUserId: adminUser.id,
          items: {
            create: [
              {
                tenantId: tenant.id,
                description: "Kit Óleo Sintético 5W30 + Filtros (Óleo, Ar, Combustível)",
                itemType: "PECA",
                quantity: 1,
                unitCost: 650.0,
                totalCost: 650.0,
              },
              {
                tenantId: tenant.id,
                description: "Mão de Obra Especializada e Lubrificação Geral",
                itemType: "SERVICO",
                quantity: 1,
                unitCost: 280.0,
                totalCost: 280.0,
              },
            ],
          },
        },
      });
    }
  }

  const truckVehicle = createdVehicles["BVT5163"]; // VW 14.190 Basculante
  if (truckVehicle) {
    const existingOrder = await prisma.maintenanceOrder.findFirst({
      where: { tenantId: tenant.id, orderNumber: "OS-2025-002" },
    });

    if (!existingOrder) {
      await prisma.maintenanceOrder.create({
        data: {
          tenantId: tenant.id,
          vehicleId: truckVehicle.id,
          orderNumber: "OS-2025-002",
          type: MaintenanceType.CORRETIVA,
          status: OrderStatus.EM_EXECUCAO,
          priority: Criticality.ALTA,
          origin: "OPERACIONAL",
          description: "Substituição de flexível de freio e ajuste do sistema pneumático",
          diagnosis: "Pequeno vazamento de ar detectado na inspeção prévia",
          openedAt: new Date("2025-03-05T09:15:00Z"),
          startedAt: new Date("2025-03-05T10:00:00Z"),
          odometerAtOpen: 52100,
          partsCost: 320.0,
          laborCost: 180.0,
          totalCost: 500.0,
          providerName: "Oficina Municipal de Manutenção Pesada",
          assignedUserId: adminUser.id,
          items: {
            create: [
              {
                tenantId: tenant.id,
                description: "Mangueira Flexível de Freio Pneumático Reforçada",
                itemType: "PECA",
                quantity: 2,
                unitCost: 160.0,
                totalCost: 320.0,
              },
              {
                tenantId: tenant.id,
                description: "Mão de Obra de Troca e Teste de Estanqueidade",
                itemType: "SERVICO",
                quantity: 1,
                unitCost: 180.0,
                totalCost: 180.0,
              },
            ],
          },
        },
      });
    }
  }

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
