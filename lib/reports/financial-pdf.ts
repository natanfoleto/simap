import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FinancialSummaryData } from "@/hooks/use-financial";
import { formatBRL, formatPercentage, formatUTCDate } from "@/lib/formatters";

export interface GeneratePdfOptions {
  tenantName: string;
  generatedBy: string;
  data: FinancialSummaryData;
  filterLabels: {
    period: string;
    category?: string;
    department?: string;
  };
}

export function generateFinancialReportPdf(options: GeneratePdfOptions) {
  const { tenantName, generatedBy, data, filterLabels } = options;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const accentColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const mutedColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Cabeçalho Institucional
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(tenantName.toUpperCase(), 14, 11);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("SIMAP — Sistema Integrado de Manutenção Automotiva Preventiva", 14, 18);

  // Carimbo à direita
  doc.setFontSize(7.5);
  doc.text(`Emissão: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 196, 11, { align: "right" });
  doc.text(`Responsável: ${generatedBy}`, 196, 18, { align: "right" });

  let currentY = 32;

  // 2. Título do Relatório
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Monitoramento e Visão Financeira da Frota", 14, currentY);

  currentY += 6;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  const filterText = `Período: ${filterLabels.period} | Início: ${formatUTCDate(data.period.start)} | Fim: ${formatUTCDate(data.period.end)} | Categoria: ${filterLabels.category || "Todas"} | Departamento: ${filterLabels.department || "Todos"}`;
  doc.text(filterText, 14, currentY);

  currentY += 8;

  // 3. Tabela de Indicadores Chave (Cards em formato de tabela)
  const kpiHeaders = [["Indicador Chave", "Valor Apurado", "Referência / Meta", "Status"]];
  const costPerKmText = data.summary.costPerKm !== null ? `R$ ${data.summary.costPerKm.toFixed(2)}/km` : "Sem dados suficientes";

  const kpiData = [
    ["Custo Total com Manutenção", formatBRL(data.summary.totalCost), "Planejado no Exercício", "Acompanhado"],
    ["Custo em Manutenções Preventivas", `${formatBRL(data.summary.preventiveCost)} (${data.summary.preventiveCostPercentage}%)`, "Meta: Maioria do Custo", data.summary.preventiveCostPercentage >= 50 ? "Favorável" : "Atenção"],
    ["Custo em Manutenções Corretivas", `${formatBRL(data.summary.correctiveCost)} (${data.summary.correctiveCostPercentage}%)`, "Meta: Redução Progressiva", data.summary.correctiveCostPercentage < 50 ? "Controlado" : "Elevado"],
    ["Custo Médio por Km Rodado", costPerKmText, "Parâmetro Operacional", data.summary.costPerKm !== null ? "Calculado" : "Requer Leituras"],
    ["Disponibilidade da Frota", `${data.summary.availabilityPercentage}%`, "Meta Mínima: 90%", data.summary.availabilityPercentage >= 90 ? "Dentro da Meta" : "Abaixo da Meta"],
    ["Total de Horas de Parada (Downtime)", `${data.summary.totalDowntimeHours} h`, `${data.summary.totalFleetHours} h possíveis`, "Sem sobreposição"],
    ["Cumprimento do Plano Preventivo", `${data.summary.preventiveCompliancePercentage}%`, "Meta: 100% no prazo", data.summary.preventiveCompliancePercentage >= 80 ? "Adequado" : "Requer Atenção"],
    ["Índice de Qualidade dos Registros", `${data.summary.dataQualityScore}%`, "Cobertura de Odômetro e Custos", data.summary.dataQualityScore >= 80 ? "Alto" : "Regular"],
  ];

  autoTable(doc, {
    startY: currentY,
    head: kpiHeaders,
    body: kpiData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
    },
  });

  // @ts-expect-error - jspdf-autotable extends jsPDF with lastAutoTable
  currentY = (doc.lastAutoTable.finalY || 100) + 8;

  // 4. Distribuição por Categoria
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento por Categoria de Veículo", 14, currentY);

  currentY += 4;

  const categoryHeaders = [["Categoria", "Ordens", "Custo Preventivo", "Custo Corretivo", "Custo Total", "Participação"]];
  const categoryData = data.categoriesDistribution.map((cat) => {
    const share = data.summary.totalCost > 0 ? (cat.totalCost / data.summary.totalCost) * 100 : 0;
    return [
      cat.category,
      String(cat.ordersCount),
      formatBRL(cat.preventiveCost),
      formatBRL(cat.correctiveCost),
      formatBRL(cat.totalCost),
      formatPercentage(share),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: categoryHeaders,
    body: categoryData.length > 0 ? categoryData : [["Nenhuma ordem registrada no período", "-", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { textColor: accentColor },
      4: { fontStyle: "bold" },
    },
  });

  // @ts-expect-error - jspdf-autotable extends jsPDF with lastAutoTable
  currentY = (doc.lastAutoTable.finalY || 160) + 8;

  // 5. Veículos com Maior Custo de Manutenção
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Top Veículos em Volume Financeiro de Manutenção", 14, currentY);

  currentY += 4;

  const topVehicles = [...data.vehiclesSummary]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10);

  const vehicleHeaders = [["Cód. / Placa", "Categoria", "Departamento", "Km Rodado", "Custo/Km", "Custo Total"]];
  const vehicleData = topVehicles.map((v) => [
    `${v.fleetCode} (${v.plate})`,
    v.category,
    v.department,
    v.kmDriven > 0 ? `${v.kmDriven.toLocaleString("pt-BR")} km` : "Sem leitura",
    v.costPerKm !== null ? `R$ ${v.costPerKm.toFixed(2)}/km` : "—",
    formatBRL(v.totalCost),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: vehicleHeaders,
    body: vehicleData.length > 0 ? vehicleData : [["Nenhum veículo com custo registrado", "-", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      5: { fontStyle: "bold" },
    },
  });

  // @ts-expect-error - jspdf-autotable extends jsPDF with lastAutoTable
  currentY = (doc.lastAutoTable.finalY || 220) + 8;

  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Rodapé e Notas de Governança
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(
    "* Este documento é gerado de forma automatizada pelo SIMAP com base nas Ordens de Serviço, vistorias e registros de hodômetro auditados do município. Valores sem leituras de odômetro suficientes são exibidos como 'Sem dados suficientes' para preservar a fidedignidade analítica.",
    14,
    currentY,
    { maxWidth: 182 }
  );

  // Salva o arquivo
  const filename = `SIMAP_Relatorio_Financeiro_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
