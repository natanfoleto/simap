"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useImportVehiclesPreview, useImportVehiclesCommit } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  FileSpreadsheet,
  Download,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HelpCircle,
  FileCheck2,
} from "lucide-react";
import { ValidatedVehicleRow, CsvRowError } from "@/app/api/vehicles/import/route";

export default function ImportVehiclesPage({ params }: { params: { tenantSlug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const previewMutation = useImportVehiclesPreview();
  const commitMutation = useImportVehiclesCommit();

  const [csvRaw, setCsvRaw] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [previewData, setPreviewData] = useState<{
    totalLines: number;
    validCount: number;
    errorCount: number;
    validRows: ValidatedVehicleRow[];
    errors: CsvRowError[];
  } | null>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      setCsvRaw(content);

      try {
        const res = await previewMutation.mutateAsync(content);
        setPreviewData(res);
        toast({
          title: "Planilha analisada",
          description: `${res.validCount} veículos válidos, ${res.errorCount} com pendências.`,
        });
      } catch (err: unknown) {
        toast({
          title: "Erro ao analisar",
          description: (err as Error).message || "Falha na estrutura do arquivo.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleCommit() {
    if (!previewData?.validRows || previewData.validRows.length === 0) {
      toast({
        title: "Nenhum veículo para importar",
        description: "Corrija as inconsistências da planilha antes de confirmar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await commitMutation.mutateAsync(previewData.validRows);
      toast({
        title: "Importação concluída!",
        description: `${res.count} veículos foram cadastrados com sucesso.`,
      });
      router.push(`/${params.tenantSlug}/veiculos`);
    } catch (err: unknown) {
      toast({
        title: "Erro na importação",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.tenantSlug}/veiculos`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Importação da Frota em Lote (CSV)
            </h1>
            <p className="text-xs text-muted-foreground">
              Importe os 97 veículos oficiais de Jaborandi/SP através do modelo estruturado
            </p>
          </div>
        </div>

        <a href="/templates/template_importacao_veiculos.csv" download="template_importacao_veiculos.csv">
          <Button variant="outline" className="rounded-2xl gap-2 shadow-sm">
            <Download className="h-4 w-4 text-primary" />
            Baixar Template CSV
          </Button>
        </a>
      </div>

      {/* Step 1: Upload and Template Instructions */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            1. Selecionar Arquivo CSV
          </CardTitle>
          <CardDescription className="text-xs">
            Certifique-se de que as colunas correspondem ao template oficial antes de enviar
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-3xl p-8 text-center bg-card/20 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Upload className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {fileName ? `Arquivo selecionado: ${fileName}` : "Arraste sua planilha CSV ou clique para selecionar"}
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: .csv (separado por vírgulas, codificação UTF-8)
              </p>
            </div>

            <div className="pt-2">
              <label htmlFor="csvFileInput">
                <Button variant="secondary" asChild className="rounded-2xl cursor-pointer gap-2 shadow-sm">
                  <span>
                    <Upload className="h-4 w-4" />
                    Escolher Arquivo CSV
                  </span>
                </Button>
              </label>
              <input
                id="csvFileInput"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-muted/20 border border-border/20 flex items-start gap-3">
            <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Instruções de preenchimento:</p>
              <p>• <strong>codigo_frota</strong> (ex: ONB-01), <strong>placa</strong> (ex: ABC1D23), <strong>categoria</strong> (ONIBUS, AMBULANCIA, CARRO, VAN, CAMINHAO, MOTOCICLETA, MAQUINA, OUTRO).</p>
              <p>• <strong>marca</strong>, <strong>modelo</strong>, <strong>ano</strong> (numérico), <strong>combustivel</strong> (DIESEL, FLEX, GASOLINA), <strong>finalidade</strong> (obrigatórios).</p>
              <p>• O sistema rejeita duplicações de placas ou códigos dentro da mesma planilha e com o banco de dados.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Validation Preview & Errors */}
      {previewMutation.isPending && (
        <Card className="p-8 text-center rounded-3xl border-border/40 bg-card/30 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-semibold">Validando registros linha a linha...</p>
        </Card>
      )}

      {previewData && (
        <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
          <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                2. Relatório de Validação da Planilha
              </CardTitle>
              <CardDescription className="text-xs">
                Total de {previewData.totalLines} linhas processadas
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="success" className="gap-1 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {previewData.validCount} Válidos
              </Badge>

              {previewData.errorCount > 0 && (
                <Badge variant="destructive" className="gap-1 px-3 py-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {previewData.errorCount} Rejeitados
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Se houver erros */}
            {previewData.errorCount > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Linhas com Erros / Rejeitadas ({previewData.errorCount})
                </h4>
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-destructive/10">
                      <TableRow>
                        <TableHead className="w-[80px]">Linha</TableHead>
                        <TableHead className="w-[120px]">Cód. Frota</TableHead>
                        <TableHead className="w-[120px]">Placa</TableHead>
                        <TableHead>Diagnóstico do Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.errors.map((err, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold text-xs">Linha {err.line}</TableCell>
                          <TableCell className="font-mono text-xs">{err.codigo_frota || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{err.placa || "—"}</TableCell>
                          <TableCell className="text-xs text-destructive font-medium">{err.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Veículos Prontos para Gravação */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Prévia dos Veículos Válidos ({previewData.validCount})
              </h4>
              <div className="rounded-2xl border border-border/30 overflow-hidden max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cód. Frota</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Finalidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.validRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold text-xs">{row.fleetCode}</TableCell>
                        <TableCell className="font-mono text-xs">{row.plate}</TableCell>
                        <TableCell className="text-xs">{row.category}</TableCell>
                        <TableCell className="text-xs">{row.brand} {row.model}</TableCell>
                        <TableCell className="text-xs">{row.year}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.purpose}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              A importação será executada em uma única transação segura no banco de dados.
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewData(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCommit}
                disabled={previewData.validCount === 0 || commitMutation.isPending}
                className="rounded-xl gap-2 shadow-md shadow-primary/20 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {commitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gravando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar Importação de {previewData.validCount} Veículos
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
